      class PomodoroTimer {
            constructor() {
                this.isRunning = false;
                this.isPaused = false;
                this.timeLeft = 25 * 60; // 25 minutes in seconds
                this.totalTime = 25 * 60;
                this.mode = 'work'; // work, break, longBreak
                this.sessionCount = 0;
                this.sessionsCompleted = 0;
                this.tasks = this.loadTasks();
                this.stats = this.loadStats();
                this.interval = null;
                
                this.workTime = 25;
                this.breakTime = 5;
                this.longBreakTime = 15;
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.updateDisplay();
                this.renderTasks();
                this.updateStats();
                this.loadSettings();
            }

            setupEventListeners() {
                // Timer controls
                document.getElementById('startBtn').addEventListener('click', () => this.startTimer());
                document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimer());
                document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
                document.getElementById('skipBtn').addEventListener('click', () => this.skipSession());

                // Settings
                document.getElementById('workTime').addEventListener('change', (e) => {
                    this.workTime = parseInt(e.target.value);
                    this.saveSettings();
                    if (!this.isRunning) this.resetTimer();
                });

                document.getElementById('breakTime').addEventListener('change', (e) => {
                    this.breakTime = parseInt(e.target.value);
                    this.saveSettings();
                });

                document.getElementById('longBreakTime').addEventListener('change', (e) => {
                    this.longBreakTime = parseInt(e.target.value);
                    this.saveSettings();
                });

                // Task management
                document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
                document.getElementById('taskInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTask();
                });

                // Notification permission
                this.requestNotificationPermission();
            }

            startTimer() {
                if (!this.isRunning) {
                    this.isRunning = true;
                    this.isPaused = false;
                    
                    document.getElementById('startBtn').disabled = true;
                    document.getElementById('pauseBtn').disabled = false;
                    
                    this.interval = setInterval(() => {
                        this.timeLeft--;
                        this.updateDisplay();
                        
                        if (this.timeLeft <= 0) {
                            this.completeSession();
                        }
                    }, 1000);
                }
            }

            pauseTimer() {
                if (this.isRunning && !this.isPaused) {
                    this.isPaused = true;
                    clearInterval(this.interval);
                    document.getElementById('pauseBtn').textContent = 'Resume';
                    document.getElementById('timerStatus').textContent = 'Paused';
                } else if (this.isPaused) {
                    this.isPaused = false;
                    this.startTimer();
                    document.getElementById('pauseBtn').textContent = 'Pause';
                }
            }

            resetTimer() {
                clearInterval(this.interval);
                this.isRunning = false;
                this.isPaused = false;
                this.setMode('work');
                
                document.getElementById('startBtn').disabled = false;
                document.getElementById('pauseBtn').disabled = true;
                document.getElementById('pauseBtn').textContent = 'Pause';
                
                this.updateDisplay();
            }

            skipSession() {
                clearInterval(this.interval);
                this.isRunning = false;
                this.isPaused = false;
                
                if (this.mode === 'work') {
                    this.sessionCount++;
                    if (this.sessionCount % 4 === 0) {
                        this.setMode('longBreak');
                    } else {
                        this.setMode('break');
                    }
                } else {
                    this.setMode('work');
                }
                
                document.getElementById('startBtn').disabled = false;
                document.getElementById('pauseBtn').disabled = true;
                this.updateDisplay();
            }

            completeSession() {
                clearInterval(this.interval);
                this.isRunning = false;
                
                if (this.mode === 'work') {
                    this.sessionsCompleted++;
                    this.sessionCount++;
                    this.stats.pomodorosCompleted++;
                    this.saveStats();
                    this.updateStats();
                    
                    this.showNotification('Great job!', 'Time for a break 🎉', 'break');
                    
                    if (this.sessionCount % 4 === 0) {
                        this.setMode('longBreak');
                    } else {
                        this.setMode('break');
                    }
                } else {
                    this.showNotification('Break over!', 'Ready to focus? 💪', 'work');
                    this.setMode('work');
                }
                
                document.getElementById('startBtn').disabled = false;
                document.getElementById('pauseBtn').disabled = true;
                this.updateDisplay();
                this.pulseAnimation();
            }

            setMode(mode) {
                this.mode = mode;
                this.isRunning = false;
                this.isPaused = false;
                
                switch (mode) {
                    case 'work':
                        this.totalTime = this.workTime * 60;
                        document.body.className = 'work-mode';
                        document.getElementById('timerStatus').textContent = 'Focus Time';
                        break;
                    case 'break':
                        this.totalTime = this.breakTime * 60;
                        document.body.className = 'break-mode';
                        document.getElementById('timerStatus').textContent = 'Short Break';
                        break;
                    case 'longBreak':
                        this.totalTime = this.longBreakTime * 60;
                        document.body.className = 'long-break-mode';
                        document.getElementById('timerStatus').textContent = 'Long Break';
                        break;
                }
                
                this.timeLeft = this.totalTime;
                this.updateProgressBar();
            }

            updateDisplay() {
                const minutes = Math.floor(this.timeLeft / 60);
                const seconds = this.timeLeft % 60;
                document.getElementById('timerDisplay').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                document.getElementById('completedSessions').textContent = this.sessionsCompleted;
                document.getElementById('currentSession').textContent = `${(this.sessionCount % 4) + 1}/4`;
                document.getElementById('totalFocusTime').textContent = `${this.sessionsCompleted * this.workTime}m`;
                
                this.updateProgressBar();
            }

            updateProgressBar() {
                const progress = document.querySelector('.timer-progress');
                const circumference = 2 * Math.PI * 45;
                const offset = circumference - (this.timeLeft / this.totalTime) * circumference;
                
                progress.style.strokeDashoffset = offset;
                progress.className = `timer-progress ${this.mode}-progress`;
            }

            addTask() {
                const input = document.getElementById('taskInput');
                const text = input.value.trim();
                
                if (text) {
                    const task = {
                        id: Date.now(),
                        text: text,
                        completed: false,
                        pomodoros: 0,
                        createdAt: new Date().toISOString()
                    };
                    
                    this.tasks.unshift(task);
                    this.saveTasks();
                    this.renderTasks();
                    input.value = '';
                }
            }

            toggleTask(id) {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    if (task.completed) {
                        this.stats.tasksCompleted++;
                        this.saveStats();
                        this.updateStats();
                    }
                    this.saveTasks();
                    this.renderTasks();
                }
            }

            deleteTask(id) {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
                this.renderTasks();
            }

            renderTasks() {
                const container = document.getElementById('tasksList');
                
                if (this.tasks.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: #bdc3c7; padding: 40px;">No tasks yet. Add your first task!</div>';
                    return;
                }
                
                container.innerHTML = this.tasks.map(task => `
                    <div class="task-item ${task.completed ? 'completed' : ''} slide-in">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="pomodoro.toggleTask(${task.id})">
                        <div class="task-content">
                            <div class="task-text">${this.escapeHtml(task.text)}</div>
                        </div>
                        ${task.pomodoros > 0 ? `<span class="task-pomodoro">${task.pomodoros}🍅</span>` : ''}
                        <div class="task-actions">
                            <button class="task-action-btn delete-btn" onclick="pomodoro.deleteTask(${task.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            showNotification(title, message, type) {
                const notification = document.getElementById('notification');
                document.getElementById('notificationTitle').textContent = title;
                document.getElementById('notificationMessage').textContent = message;
                
                notification.className = `notification ${type} show`;
                
                // Browser notification
                if (Notification.permission === 'granted') {
                    new Notification(title, { body: message, icon: '/icon.png' });
                }
                
                // Sound notification (you can add actual sound files)
                this.playNotificationSound();
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 5000);
            }

            playNotificationSound() {
                // Simple beep sound using Web Audio API
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 1);
                } catch (e) {
                    console.log('Web Audio API not supported');
                }
            }

            requestNotificationPermission() {
                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }

            pulseAnimation() {
                document.getElementById('timerDisplay').classList.add('pulse');
                setTimeout(() => {
                    document.getElementById('timerDisplay').classList.remove('pulse');
                }, 1000);
            }

            updateStats() {
                document.getElementById('tasksCompleted').textContent = this.stats.tasksCompleted;
                document.getElementById('pomodorosCompleted').textContent = this.stats.pomodorosCompleted;
            }

            loadSettings() {
                const settings = JSON.parse(localStorage.getItem('pomodoroSettings'));
                if (settings) {
                    this.workTime = settings.workTime || 25;
                    this.breakTime = settings.breakTime || 5;
                    this.longBreakTime = settings.longBreakTime || 15;
                    
                    document.getElementById('workTime').value = this.workTime;
                    document.getElementById('breakTime').value = this.breakTime;
                    document.getElementById('longBreakTime').value = this.longBreakTime;
                }
            }

            saveSettings() {
                const settings = {
                    workTime: this.workTime,
                    breakTime: this.breakTime,
                    longBreakTime: this.longBreakTime
                };
                localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
            }

            loadTasks() {
                return JSON.parse(localStorage.getItem('pomodoroTasks')) || [];
            }

            saveTasks() {
                localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
            }

            loadStats() {
                const today = new Date().toDateString();
                const stats = JSON.parse(localStorage.getItem('pomodoroStats')) || {};
                
                // Reset stats if it's a new day
                if (stats.date !== today) {
                    return { date: today, tasksCompleted: 0, pomodorosCompleted: 0 };
                }
                
                return stats;
            }

            saveStats() {
                this.stats.date = new Date().toDateString();
                localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
        }

        // Initialize the pomodoro timer
        const pomodoro = new PomodoroTimer();
    
