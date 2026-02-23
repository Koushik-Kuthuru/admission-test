document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get State from LocalStorage
    const selectedClass = localStorage.getItem('selectedClass');
    const selectedSet = localStorage.getItem('selectedSet');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

    if (!selectedClass || !selectedSet || !studentData.name) {
        alert('Invalid session. Redirecting to start.');
        window.location.href = 'index.html';
        return;
    }

    // Display Info
    document.getElementById('class-display').textContent = selectedClass;
    document.getElementById('set-display').textContent = 'Set ' + selectedSet;
    document.getElementById('student-name-display').textContent = studentData.name;

    // 2. Load Questions
    const selectedStream = localStorage.getItem('selectedStream');
    let questions = [];

    // Try loading from Firestore first
    if (window.db) {
        try {
            // Construct Document ID: e.g., "1_A" or "11_Science_(PCM)_A"
            let docId = `${selectedClass}`;
            if (selectedStream) {
                docId += `_${selectedStream}`;
            }
            docId += `_${selectedSet}`;
            
            // Sanitize ID (replace spaces with underscores as done in upload)
            docId = docId.replace(/\s+/g, '_');
            
            console.log("Fetching questions from Firestore:", docId);
            const doc = await db.collection('questions').doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                const rawQuestions = data.subjects;
                
                // Flatten if subject-wise
                if (Array.isArray(rawQuestions)) {
                    questions = rawQuestions;
                } else {
                    // Assume object with subjects
                    Object.keys(rawQuestions).forEach(subject => {
                        const subjectQuestions = rawQuestions[subject].map(q => ({
                            ...q,
                            subject: subject // Add subject tag
                        }));
                        questions = questions.concat(subjectQuestions);
                    });
                }
                console.log("Loaded questions from Firestore");
            }
        } catch (error) {
            console.error("Error loading from Firestore:", error);
            // Fallback to local data will happen below
        }
    }

    // Fallback to local data if Firestore failed or returned empty
    if (questions.length === 0) {
        console.log("Falling back to local data.js");
        let questionsData = window.QUESTIONS[selectedClass];

        // Drill down for stream if applicable
        if (selectedStream && questionsData && questionsData[selectedStream]) {
            questionsData = questionsData[selectedStream];
        }

        // Get the set
        let rawQuestions = questionsData ? questionsData[selectedSet] : null;

        if (!rawQuestions) {
            alert('No questions found for this set.');
            window.location.href = 'sets.html';
            return;
        }

        // Flatten if subject-wise
        if (Array.isArray(rawQuestions)) {
            questions = rawQuestions;
        } else {
            // Assume object with subjects
            Object.keys(rawQuestions).forEach(subject => {
                const subjectQuestions = rawQuestions[subject].map(q => ({
                    ...q,
                    subject: subject // Add subject tag
                }));
                questions = questions.concat(subjectQuestions);
            });
        }
    }

    if (questions.length === 0) {
        alert('No questions found in this set.');
        window.location.href = 'sets.html';
        return;
    }

    let currentQuestionIndex = 0;
    const userAnswers = {}; // { 0: 'Option A', 1: 'Option B' }

    const questionTextEl = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const endTestBtn = document.getElementById('end-test-btn');
    const currentQNumEl = document.getElementById('current-q-num');
    const totalQNumEl = document.getElementById('total-q-num');
    const progressBar = document.getElementById('progress-bar');
    const paletteContainer = document.getElementById('question-palette');

    totalQNumEl.textContent = questions.length;

    // Initialize Palette
    function initPalette() {
        if (!paletteContainer) return;
        paletteContainer.innerHTML = '';
        questions.forEach((_, index) => {
            const btn = document.createElement('button');
            btn.className = `w-10 h-10 rounded-lg text-sm font-bold border flex items-center justify-center transition-all ${
                index === currentQuestionIndex 
                    ? 'bg-gray-900 border-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' 
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 shadow-sm'
            }`;
            btn.textContent = index + 1;
            btn.id = `palette-${index}`;
            btn.onclick = () => {
                currentQuestionIndex = index;
                renderQuestion(currentQuestionIndex);
            };
            paletteContainer.appendChild(btn);
        });
    }

    function updatePalette() {
        if (!paletteContainer) return;
        questions.forEach((_, index) => {
            const btn = document.getElementById(`palette-${index}`);
            if (!btn) return;

            // Reset base classes
            let baseClass = "w-10 h-10 rounded-lg text-sm font-bold border flex items-center justify-center transition-all ";
            
            if (index === currentQuestionIndex) {
                btn.className = baseClass + "bg-gray-900 border-gray-900 text-white ring-2 ring-gray-900 ring-offset-2 scale-105 z-10 shadow-md";
            } else if (userAnswers[index]) {
                btn.className = baseClass + "bg-idps-primary text-white border-idps-primary shadow-sm";
            } else {
                btn.className = baseClass + "bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 shadow-sm";
            }
        });
    }

    initPalette();

    // 3. Render Question Function
    function renderQuestion(index) {
        const q = questions[index];
        currentQNumEl.textContent = index + 1;
        
        // Show subject if available
        const subjectBadge = q.subject 
            ? `<span class="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md mb-4 border border-blue-100 uppercase tracking-wider font-bold select-none shadow-sm">${q.subject}</span><br>` 
            : '';
        
        // Update Progress Bar
        const progress = ((Object.keys(userAnswers).length) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;

        questionTextEl.innerHTML = subjectBadge + q.q; // Use innerHTML to support basic formatting if needed
        optionsContainer.innerHTML = '';

        q.options.forEach(opt => {
            const isSelected = userAnswers[index] === opt;
            const optionId = `option-${index}-${opt.replace(/\s+/g, '-')}`;

            const label = document.createElement('label');
            label.className = 'block cursor-pointer group relative';
            label.innerHTML = `
                <input type="radio" name="question-${index}" value="${opt}" class="hidden peer" ${isSelected ? 'checked' : ''}>
                <div class="p-5 pl-14 rounded-xl border-2 border-gray-100 bg-white peer-checked:border-idps-primary peer-checked:bg-green-50/30 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm peer-checked:shadow-md">
                    <span class="text-gray-700 font-medium peer-checked:text-gray-900 peer-checked:font-bold text-lg transition-colors">${opt}</span>
                </div>
                <div class="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 border-2 border-gray-300 rounded-full peer-checked:border-idps-primary peer-checked:bg-idps-primary transition-all flex items-center justify-center group-hover:border-gray-400">
                    <div class="w-2.5 h-2.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity transform scale-0 peer-checked:scale-100"></div>
                </div>
            `;
            
            label.querySelector('input').addEventListener('change', (e) => {
                userAnswers[index] = e.target.value;
                updatePalette();
                // Update progress bar immediately on selection
                const progress = ((Object.keys(userAnswers).length) / questions.length) * 100;
                progressBar.style.width = `${progress}%`;
            });

            optionsContainer.appendChild(label);
        });

        // Update Buttons
        prevBtn.disabled = index === 0;
        if (index === questions.length - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }

        updatePalette();
    }

    // 4. Navigation Handlers
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        }
    });

    // 5. Submit Logic
    async function submitExam(autoSubmit = false) {
        // Calculate Score
        let score = 0;
        const results = questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.ans;
            if (isCorrect) score++;
            
            return {
                question: q.q,
                userAnswer: userAnswer || 'Not Answered',
                correctAnswer: q.ans,
                isCorrect: isCorrect,
                options: q.options,
                subject: q.subject // Add subject to result
            };
        });

        const total = questions.length;
        const percentage = ((score / total) * 100).toFixed(2);

        // Save Result
        const examResult = {
            student: studentData,
            class: selectedClass,
            set: selectedSet,
            score: score,
            total: total,
            percentage: percentage,
            details: results,
            date: new Date().toISOString()
        };

        localStorage.setItem('examResult', JSON.stringify(examResult));
        
        // Clear session data
        localStorage.removeItem('examStartTime');

        // Show saving state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...';
        }

        // Save to Firebase
        if (window.db) {
            try {
                await window.db.collection("exam_results").add(examResult);
                console.log("Exam result saved to Firestore");
            } catch (error) {
                console.error("Error saving result to Firestore:", error);
                // Proceed anyway, data is in localStorage
            }
        }

        if (autoSubmit) {
            alert('Time is up! Submitting your exam automatically.');
        }
        
        window.location.href = 'result.html';
    }

    submitBtn.addEventListener('click', () => {
        const answeredCount = Object.keys(userAnswers).length;
        const remaining = questions.length - answeredCount;
        
        let message = 'Are you sure you want to submit?';
        if (remaining > 0) {
            message = `You have ${remaining} unanswered questions. Are you sure you want to submit?`;
        }

        if (confirm(message)) {
            submitExam();
        }
    });

    if (endTestBtn) {
        endTestBtn.addEventListener('click', () => {
            const answeredCount = Object.keys(userAnswers).length;
            const remaining = questions.length - answeredCount;
            
            let message = 'Are you sure you want to end the test? This will submit your current answers.';
            if (remaining > 0) {
                message = `You have ${remaining} unanswered questions. Ending the test will submit your current progress. Continue?`;
            }

            if (confirm(message)) {
                submitExam();
            }
        });
    }

    // 6. Timer Logic
    const config = window.EXAM_CONFIG[selectedClass];
    // Convert duration to milliseconds to avoid timezone/clock issues
    const DURATION_MINUTES = config ? (config.duration || 45) : 45;
    const DURATION_MS = DURATION_MINUTES * 60 * 1000;
    
    // Check if start time exists, if not set it
    let startTime = localStorage.getItem('examStartTime');
    if (!startTime) {
        startTime = Date.now().toString();
        localStorage.setItem('examStartTime', startTime);
    }

    const timerEl = document.getElementById('timer');
    const timerContainer = document.getElementById('timer-container');
    
    const timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - parseInt(startTime);
        let timeLeftMs = DURATION_MS - elapsedMs;

        if (timeLeftMs <= 0) {
            timeLeftMs = 0;
            clearInterval(timerInterval);
            timerEl.textContent = "00:00";
            submitExam(true);
            return;
        }

        const totalSecondsLeft = Math.floor(timeLeftMs / 1000);
        const minutes = Math.floor(totalSecondsLeft / 60);
        const seconds = totalSecondsLeft % 60;
        
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (totalSecondsLeft <= 300) { // Red color for last 5 mins
            timerContainer.classList.add('bg-red-50', 'text-red-600', 'border-red-200', 'animate-pulse');
            timerContainer.classList.remove('bg-white', 'text-gray-800');
        }
    }, 1000);

    // Initial Render
    renderQuestion(currentQuestionIndex);
});
