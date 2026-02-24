document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const isAdmin = sessionStorage.getItem('adminLoggedIn');
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // 2. DOM Elements
    const tableBody = document.getElementById('resultsTableBody');
    const totalExamsEl = document.getElementById('total-exams');
    const avgScoreEl = document.getElementById('avg-score');
    const searchInput = document.getElementById('searchInput');
    const classFilter = document.getElementById('classFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const showingCount = document.getElementById('showing-count');
    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');
    const logoutBtn = document.getElementById('logoutBtn');

    let allResults = [];

    // 3. Fetch Data
    async function fetchResults() {
        if (!window.db) {
            console.error("Firebase not initialized");
            return;
        }

        try {
            refreshBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Loading...';
            refreshBtn.disabled = true;

            const snapshot = await db.collection('exam_results').orderBy('date', 'desc').get();
            
            allResults = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                allResults.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log("Fetched results:", allResults.length);
            renderTable(allResults);
            updateStats(allResults);
            populateFilters(allResults);

        } catch (error) {
            console.error("Error fetching results:", error);
            alert("Error loading data. Check console.");
        } finally {
            refreshBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">refresh</span> Refresh Data';
            refreshBtn.disabled = false;
        }
    }

    // 4. Render Table and Cards
    function renderTable(data) {
        const tableBody = document.getElementById('resultsTableBody');
        const cardsContainer = document.getElementById('resultsCards');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const showingCount = document.getElementById('showing-count');

        // Reset
        tableBody.innerHTML = '';
        cardsContainer.innerHTML = '';
        loadingState.classList.add('hidden');
        
        if (data.length === 0) {
            emptyState.classList.remove('hidden');
            showingCount.textContent = 0;
            return;
        }

        emptyState.classList.add('hidden');
        showingCount.textContent = data.length;

        data.forEach(result => {
            const student = result.student || {};
            const score = result.score || 0;
            const total = result.total || 0;
            const percentage = result.percentage || 0;
            const date = result.date ? new Date(result.date).toLocaleDateString() : 'N/A';
            
            // Determine badge color based on percentage
            let badgeClass = 'bg-gray-100 text-gray-800';
            if (percentage >= 80) badgeClass = 'bg-green-100 text-green-800';
            else if (percentage >= 60) badgeClass = 'bg-blue-100 text-blue-800';
            else if (percentage >= 40) badgeClass = 'bg-yellow-100 text-yellow-800';
            else badgeClass = 'bg-red-100 text-red-800';

            // Desktop Row
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors border-b border-gray-100';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${student.name || 'Unknown'}</div>
                        <div class="text-xs text-gray-500">${student.email || 'No Email'}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-bold">Class ${result.class}</div>
                    <div class="text-xs text-gray-500">${student.stream || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
                        ${score} / ${total} (${percentage}%)
                    </span>
                </td>
                <!-- Set Column Removed -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="relative inline-block text-left">
                        <button class="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-idps-primary" onclick="toggleMenu('${result.id}')">
                            <span class="material-symbols-outlined text-gray-500">more_vert</span>
                        </button>
                        <div id="menu-${result.id}" class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-in origin-top-right focus:outline-none">
                            <div class="py-1" role="menu" aria-orientation="vertical">
                                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2" role="menuitem" onclick="openDetails(allResults.find(r => r.id === '${result.id}'))">
                                    <span class="material-symbols-outlined text-[18px]">visibility</span> View Details
                                </button>
                                <button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-900 flex items-center gap-2" role="menuitem" onclick="deleteResult('${result.id}')">
                                    <span class="material-symbols-outlined text-[18px]">delete</span> Delete Result
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);

            // Mobile Card
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative';
            card.innerHTML = `
                <div class="absolute top-2 right-2">
                    <div class="relative inline-block text-left">
                        <button class="p-1 rounded-full hover:bg-gray-100 transition-colors" onclick="toggleMenu('mobile-${result.id}')">
                            <span class="material-symbols-outlined text-gray-400 text-[20px]">more_vert</span>
                        </button>
                        <div id="menu-mobile-${result.id}" class="hidden absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-in origin-top-right">
                            <div class="py-1">
                                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2" onclick="openDetails(allResults.find(r => r.id === '${result.id}'))">
                                    <span class="material-symbols-outlined text-[16px]">visibility</span> View
                                </button>
                                <button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onclick="deleteResult('${result.id}')">
                                    <span class="material-symbols-outlined text-[16px]">delete</span> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-start pr-8">
                    <div>
                        <div class="text-sm font-bold text-gray-900">${student.name || 'Unknown'}</div>
                        <div class="text-xs text-gray-500">Class ${result.class} ${student.stream ? `(${student.stream})` : ''}</div>
                    </div>
                    <span class="px-2 py-1 text-xs font-bold rounded-lg ${badgeClass}">
                        ${percentage}%
                    </span>
                </div>
                
                <div class="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-1">
                    <div class="flex gap-4">
                        <!-- Set Removed -->
                        <span><span class="font-semibold text-gray-700">Date:</span> ${date}</span>
                    </div>
                </div>
            `;

            cardsContainer.appendChild(card);
        });
    }

    // Toggle Menu
    window.toggleMenu = (id) => {
        // Close all other menus first
        document.querySelectorAll('[id^="menu-"]').forEach(el => {
            if (el.id !== `menu-${id}`) el.classList.add('hidden');
        });
        
        const menu = document.getElementById(`menu-${id}`);
        if (menu) {
            menu.classList.toggle('hidden');
        }
        
        // Stop propagation to prevent immediate closing
        event.stopPropagation();
    };

    // Close menus on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('[id^="menu-"]').forEach(el => el.classList.add('hidden'));
    });

    // Delete Result Logic
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let deleteId = null;

    // Make closeDeleteModal global
    window.closeDeleteModal = () => {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
        deleteId = null;
    };

    window.deleteResult = (id) => {
        deleteId = id;
        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('flex');
    };

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteId) return;
        
        const originalText = confirmDeleteBtn.innerHTML;
        confirmDeleteBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Deleting...';
        confirmDeleteBtn.disabled = true;

        try {
            if (window.db) {
                await db.collection('exam_results').doc(deleteId).delete();
                // Refresh local data
                allResults = allResults.filter(r => r.id !== deleteId);
                renderTable(allResults); 
                updateStats(allResults);
                
                // Show success (optional, or just close)
                closeDeleteModal();
            } else {
                alert('Firebase not connected. Cannot delete.');
                closeDeleteModal();
            }
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert('Error deleting result. Check console.');
            closeDeleteModal();
        } finally {
            confirmDeleteBtn.innerHTML = originalText;
            confirmDeleteBtn.disabled = false;
        }
    });

    // Close delete modal on outside click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // 5. Update Stats
    function updateStats(data) {
        totalExamsEl.textContent = data.length;
        
        if (data.length > 0) {
            const totalScore = data.reduce((acc, curr) => acc + parseFloat(curr.percentage || 0), 0);
            const avg = (totalScore / data.length).toFixed(1);
            avgScoreEl.textContent = `${avg}%`;
        } else {
            avgScoreEl.textContent = '--%';
        }
    }

    // 6. Populate Filters
    function populateFilters(data) {
        // Unique Classes
        const classes = [...new Set(data.map(item => item.class))].sort();
        
        // Keep "All Classes" option
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        classes.forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls;
            opt.textContent = `Class ${cls}`;
            classFilter.appendChild(opt);
        });
    }

    // 7. Filter Logic
    function filterData() {
        const term = searchInput.value.toLowerCase();
        const cls = classFilter.value;

        const filtered = allResults.filter(item => {
            const student = item.student || {};
            const matchesSearch = (student.name && student.name.toLowerCase().includes(term)) || 
                                  (student.email && student.email.toLowerCase().includes(term)) ||
                                  (student.phone && student.phone.includes(term));
            
            const matchesClass = cls === '' || item.class === cls;

            return matchesSearch && matchesClass;
        });

        renderTable(filtered);
        updateStats(filtered); // Update stats based on filtered view? Optional.
    }

    searchInput.addEventListener('input', filterData);
    classFilter.addEventListener('change', filterData);
    refreshBtn.addEventListener('click', fetchResults);

    // 8. Modal Logic
    window.openDetails = (result) => {
        const student = result.student || {};
        
        // Generate Details HTML
        let detailsHtml = `
            <div class="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Student Name</p>
                    <p class="font-bold text-gray-900">${student.name || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Class / Stream</p>
                    <p class="font-bold text-gray-900">${result.class} ${student.stream ? `(${student.stream})` : ''}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Parent Name</p>
                    <p class="text-gray-700">${student.father_name || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Phone</p>
                    <p class="text-gray-700">${student.phone || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">School</p>
                    <p class="text-gray-700">${student.school || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Date</p>
                    <p class="text-gray-700">${new Date(result.date).toLocaleString()}</p>
                </div>
            </div>

            <h4 class="font-bold text-lg mb-4 border-b pb-2">Question Analysis</h4>
            <div class="space-y-4">
        `;

        if (result.details && Array.isArray(result.details)) {
            result.details.forEach((q, idx) => {
                const isCorrect = q.isCorrect;
                const statusClass = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                const icon = isCorrect ? 'check_circle' : 'cancel';
                const iconColor = isCorrect ? 'text-green-600' : 'text-red-600';

                detailsHtml += `
                    <div class="p-4 rounded-lg border ${statusClass} flex gap-4">
                        <div class="flex-shrink-0 mt-1">
                            <span class="material-symbols-outlined ${iconColor}">${icon}</span>
                        </div>
                        <div class="flex-grow">
                            <p class="font-medium text-gray-900 mb-2">Q${idx + 1}: ${q.question}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div class="${isCorrect ? 'text-green-700 font-bold' : 'text-red-600'}">
                                    Your Answer: ${q.userAnswer}
                                </div>
                                <div class="text-gray-600">
                                    Correct Answer: <span class="font-bold text-gray-800">${q.correctAnswer}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            detailsHtml += `<p class="text-gray-500 italic">Detailed question analysis not available.</p>`;
        }

        detailsHtml += `</div>`;
        
        modalContent.innerHTML = detailsHtml;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to sign out?')) {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        }
    });

    // Initial Fetch
    await fetchResults();
});