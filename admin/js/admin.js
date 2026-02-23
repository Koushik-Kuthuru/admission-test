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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Set ${result.set}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-idps-primary hover:text-idps-accent font-bold flex items-center justify-end gap-1 ml-auto view-btn">
                        View
                        <span class="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                </td>
            `;
            
            // Attach desktop event
            row.querySelector('.view-btn').onclick = () => openDetails(result);
            tableBody.appendChild(row);

            // Mobile Card
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3';
            card.innerHTML = `
                <div class="flex justify-between items-start">
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
                        <span><span class="font-semibold text-gray-700">Set:</span> ${result.set}</span>
                        <span><span class="font-semibold text-gray-700">Date:</span> ${date}</span>
                    </div>
                    <button class="text-idps-primary font-bold flex items-center gap-1 view-btn-mobile p-1 rounded hover:bg-green-50 transition-colors">
                        Details <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            `;

            // Attach mobile event
            card.querySelector('.view-btn-mobile').onclick = () => openDetails(result);
            cardsContainer.appendChild(card);
        });
    }

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