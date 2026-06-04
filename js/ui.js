/**
 * UI Controller
 * Manages all DOM interactions and user interface updates
 */

import { Game } from './game.js';

/**
 * UI Controller class
 */
class UIController {
    constructor() {
        this.game = new Game();
        this.elements = this.getElements();
        this.pendingDifficulty = null;
        this.isAIThinking = false;
        
        this.init();
    }

    /**
     * Get all required DOM elements
     * @returns {Object} Object containing all DOM element references
     */
    getElements() {
        return {
            cells: document.querySelectorAll('.cell'),
            statusMessage: document.getElementById('status-message'),
            newGameBtn: document.getElementById('new-game-btn'),
            resetStatsBtn: document.getElementById('reset-stats-btn'),
            difficultyButtons: document.querySelectorAll('.difficulty-btn'),
            currentDifficulty: document.getElementById('current-difficulty'),
            wins: document.getElementById('wins'),
            losses: document.getElementById('losses'),
            draws: document.getElementById('draws'),
            modal: document.getElementById('difficulty-modal'),
            modalConfirm: document.getElementById('modal-confirm'),
            modalCancel: document.getElementById('modal-cancel'),
            streakCounter: document.getElementById('streak-counter'),
            currentStreak: document.getElementById('current-streak'),
            bestStreak: document.getElementById('best-streak')
        };
    }

    /**
     * Initialize the UI controller
     */
    init() {
        this.attachEventListeners();
        this.updateUI();
        this.updateDifficultyUI();
        this.updateStats();
        this.updateStreakDisplay();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Cell click events
        this.elements.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Keyboard navigation for cells
        this.elements.cells.forEach((cell, index) => {
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleCellClick(index);
                }
            });
        });

        // New game button
        this.elements.newGameBtn.addEventListener('click', () => this.handleNewGame());

        // Reset stats button
        this.elements.resetStatsBtn.addEventListener('click', () => this.handleResetStats());

        // Difficulty selection
        this.elements.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.getAttribute('data-difficulty');
                this.handleDifficultyChange(difficulty);
            });

            // Keyboard support for difficulty buttons
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const difficulty = btn.getAttribute('data-difficulty');
                    this.handleDifficultyChange(difficulty);
                }
            });
        });

        // Modal events
        this.elements.modalConfirm.addEventListener('click', () => this.confirmDifficultyChange());
        this.elements.modalCancel.addEventListener('click', () => this.cancelDifficultyChange());

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.modal.hidden) {
                this.cancelDifficultyChange();
            }
        });

        // Keyboard navigation between cells
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    /**
     * Handle keyboard navigation for grid
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardNavigation(e) {
        const focusedElement = document.activeElement;
        const focusedIndex = Array.from(this.elements.cells).indexOf(focusedElement);

        if (focusedIndex === -1) return;

        let newIndex = focusedIndex;

        switch (e.key) {
            case 'ArrowLeft':
                newIndex = focusedIndex % 3 > 0 ? focusedIndex - 1 : focusedIndex;
                break;
            case 'ArrowRight':
                newIndex = focusedIndex % 3 < 2 ? focusedIndex + 1 : focusedIndex;
                break;
            case 'ArrowUp':
                newIndex = focusedIndex >= 3 ? focusedIndex - 3 : focusedIndex;
                break;
            case 'ArrowDown':
                newIndex = focusedIndex < 6 ? focusedIndex + 3 : focusedIndex;
                break;
            default:
                return;
        }

        if (newIndex !== focusedIndex) {
            e.preventDefault();
            this.elements.cells[newIndex].focus();
        }
    }

    /**
     * Handle cell click
     * @param {number} index - Cell index
     */
    async handleCellClick(index) {
        // Prevent moves during AI's turn or if game is over
        if (!this.game.isHumanTurn() || this.isAIThinking) {
            return;
        }

        // Make the move
        const success = this.game.makeMove(index, 'X');
        if (!success) {
            return;
        }

        // Update UI
        this.updateUI();

        // If game is not over and it's AI's turn, make AI move
        if (this.game.isAITurn()) {
            await this.makeAIMove();
        }
    }

    /**
     * Make AI move with delay for better UX
     */
    async makeAIMove() {
        this.isAIThinking = true;
        this.updateStatusMessage('AI is thinking...');

        // Small delay to show "thinking" state
        await this.delay(300);

        const aiMove = this.game.getAIMove();
        if (aiMove !== null) {
            this.game.makeMove(aiMove, 'O');
            this.updateUI();
        }

        this.isAIThinking = false;
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle new game button click
     */
    handleNewGame() {
        this.game.reset();
        this.updateUI();
        
        // If AI goes first (would only happen if we add that feature)
        if (this.game.isAITurn()) {
            this.makeAIMove();
        }
    }

    /**
     * Handle reset stats button click
     */
    handleResetStats() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            this.game.resetStats();
            this.updateStats();
            this.updateStreakDisplay();
        }
    }

    /**
     * Handle difficulty change
     * @param {string} difficulty - New difficulty level
     */
    handleDifficultyChange(difficulty) {
        // If game is in progress, show modal
        if (this.game.moveHistory.length > 0 && !this.game.isGameOver) {
            this.pendingDifficulty = difficulty;
            this.showModal();
        } else {
            // If no game in progress, change immediately
            this.applyDifficultyChange(difficulty);
        }
    }

    /**
     * Apply difficulty change
     * @param {string} difficulty - New difficulty level
     */
    applyDifficultyChange(difficulty) {
        this.game.changeDifficulty(difficulty);
        this.game.reset();
        this.updateUI();
        this.updateDifficultyUI();
    }

    /**
     * Show difficulty change confirmation modal
     */
    showModal() {
        this.elements.modal.hidden = false;
        this.elements.modal.setAttribute('aria-hidden', 'false');
        this.elements.modalConfirm.focus();
    }

    /**
     * Hide modal
     */
    hideModal() {
        this.elements.modal.hidden = true;
        this.elements.modal.setAttribute('aria-hidden', 'true');
        this.pendingDifficulty = null;
    }

    /**
     * Confirm difficulty change
     */
    confirmDifficultyChange() {
        if (this.pendingDifficulty) {
            this.applyDifficultyChange(this.pendingDifficulty);
        }
        this.hideModal();
    }

    /**
     * Cancel difficulty change
     */
    cancelDifficultyChange() {
        this.hideModal();
    }

    /**
     * Update the entire UI based on game state
     */
    updateUI() {
        const state = this.game.getState();

        // Update cells
        this.elements.cells.forEach((cell, index) => {
            const value = state.board[index];
            cell.textContent = value || '';
            cell.disabled = value !== null || state.isGameOver;

            // Update cell classes
            cell.classList.remove('player-x', 'player-o', 'winning');
            if (value === 'X') {
                cell.classList.add('player-x');
            } else if (value === 'O') {
                cell.classList.add('player-o');
            }

            // Highlight winning combination
            if (state.winningCombination && state.winningCombination.includes(index)) {
                cell.classList.add('winning');
            }

            // Update ARIA label
            if (value) {
                cell.setAttribute('aria-label', `Cell ${index + 1}: ${value}`);
            } else {
                cell.setAttribute('aria-label', `Cell ${index + 1}: empty`);
            }
        });

        // Update status message
        this.updateStatusMessage();

        // Update stats
        this.updateStats();

        // Update streak display
        this.updateStreakDisplay();

        // Trigger confetti if player won with streak >= 3
        if (state.isGameOver && state.winner === 'X') {
            const tier = this.getStreakTier(state.stats.currentStreak);
            if (tier > 0) {
                // Small delay to let DOM update settle
                setTimeout(() => this.triggerConfetti(tier), 100);
            }
        }
    }

    /**
     * Update status message
     * @param {string} customMessage - Optional custom message
     */
    updateStatusMessage(customMessage = null) {
        if (customMessage) {
            this.elements.statusMessage.textContent = customMessage;
            return;
        }

        const state = this.game.getState();

        if (state.isGameOver) {
            if (state.winner === 'X') {
                const streak = state.stats.currentStreak;
                if (streak >= 10) {
                    this.elements.statusMessage.textContent = '🎉 You won! 🔥🔥🔥 LEGENDARY streak!';
                } else if (streak >= 5) {
                    this.elements.statusMessage.textContent = `🎉 You won! 🔥🔥 ${streak}-win streak!`;
                } else if (streak >= 3) {
                    this.elements.statusMessage.textContent = `🎉 You won! 🔥 ${streak}-win streak!`;
                } else {
                    this.elements.statusMessage.textContent = '🎉 You won!';
                }
            } else if (state.winner === 'O') {
                this.elements.statusMessage.textContent = '😔 AI won!';
            } else {
                this.elements.statusMessage.textContent = "🤝 It's a draw!";
            }
        } else {
            if (state.currentPlayer === 'X') {
                this.elements.statusMessage.textContent = 'Your turn (X)';
            } else {
                this.elements.statusMessage.textContent = "AI's turn (O)";
            }
        }
    }

    /**
     * Update difficulty UI
     */
    updateDifficultyUI() {
        const currentDifficulty = this.game.difficulty;

        // Update difficulty buttons
        this.elements.difficultyButtons.forEach(btn => {
            const btnDifficulty = btn.getAttribute('data-difficulty');
            const isActive = btnDifficulty === currentDifficulty;

            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive.toString());
        });

        // Update current difficulty text
        this.elements.currentDifficulty.textContent = 
            currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = this.game.stats;
        this.elements.wins.textContent = stats.wins;
        this.elements.losses.textContent = stats.losses;
        this.elements.draws.textContent = stats.draws;
    }

    /**
     * Get the streak tier based on current streak
     * @param {number} streak - Current streak value
     * @returns {number} Tier: 0 (none), 1 (3-4), 2 (5-9), 3 (10+)
     */
    getStreakTier(streak) {
        if (streak >= 10) return 3;
        if (streak >= 5) return 2;
        if (streak >= 3) return 1;
        return 0;
    }

    /**
     * Update streak counter display
     */
    updateStreakDisplay() {
        const stats = this.game.stats;
        const streakCounter = this.elements.streakCounter;

        if (!streakCounter) return;

        this.elements.currentStreak.textContent = stats.currentStreak;
        this.elements.bestStreak.textContent = stats.bestStreak;

        // Show/hide based on streak
        if (stats.currentStreak >= 1 || stats.bestStreak >= 1) {
            streakCounter.classList.add('visible');
        } else {
            streakCounter.classList.remove('visible');
        }

        // Remove all tier classes
        streakCounter.classList.remove('tier-1', 'tier-2', 'tier-3');

        // Apply tier class
        const tier = this.getStreakTier(stats.currentStreak);
        if (tier > 0) {
            streakCounter.classList.add(`tier-${tier}`);
        }
    }

    /**
     * Check if reduced motion is preferred
     * @returns {boolean} True if user prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Trigger confetti celebration
     * @param {number} tier - Celebration tier (1, 2, or 3)
     */
    triggerConfetti(tier) {
        if (this.prefersReducedMotion()) {
            // Apply glow fallback for reduced motion
            const streakCounter = this.elements.streakCounter;
            if (streakCounter) {
                streakCounter.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2)';
                setTimeout(() => {
                    streakCounter.style.boxShadow = '';
                }, 2000);
            }
            return;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '999';
        canvas.style.pointerEvents = 'none';
        document.body.appendChild(canvas);

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        if (tier >= 3) {
            colors.push('#fbbf24', '#f1f5f9');
        }

        // Determine particle count and duration based on tier
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768;
        const countMultiplier = isMobile ? 0.5 : (isTablet ? 0.75 : 1);

        let particleCount, duration, bursts;

        if (tier >= 3) {
            particleCount = Math.floor(200 * countMultiplier);
            duration = 4000;
            bursts = [0, 400, 800];
        } else if (tier >= 2) {
            particleCount = Math.floor(100 * countMultiplier);
            duration = 3500;
            bursts = [0, 500];
        } else {
            particleCount = Math.floor(50 * countMultiplier);
            duration = 2500;
            bursts = [0];
        }

        const particles = [];
        const startTime = performance.now();
        const particlesPerBurst = Math.floor(particleCount / bursts.length);

        /**
         * Create a single confetti particle
         * @param {number} originX - X origin position
         * @param {number} originY - Y origin position
         * @returns {Object} Particle object
         */
        function createParticle(originX, originY) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const type = Math.random();
            let width, height;

            if (type < 0.6) {
                // Rectangle
                width = 8 + Math.random() * 4;
                height = 4 + Math.random() * 2;
            } else if (type < 0.85) {
                // Circle
                width = height = (4 + Math.random() * 2) * 2;
            } else {
                // Streamer
                width = 2;
                height = 16;
            }

            return {
                x: originX,
                y: originY,
                vx: (Math.random() - 0.5) * 600,
                vy: -(600 + Math.random() * 600),
                width,
                height,
                color,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 720,
                opacity: 1,
                type: type < 0.6 ? 'rect' : (type < 0.85 ? 'circle' : 'streamer'),
                drift: Math.random() * Math.PI * 2
            };
        }

        // Schedule bursts
        bursts.forEach((delay) => {
            setTimeout(() => {
                const originX = canvas.width / 2;
                const originY = canvas.height * 0.6;
                for (let i = 0; i < particlesPerBurst; i++) {
                    particles.push(createParticle(originX, originY));
                }
            }, delay);
        });

        let lastTime = performance.now();

        /**
         * Animation loop for confetti
         */
        function animate() {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            const elapsed = now - startTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let activeParticles = 0;

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                // Physics
                p.vy += 600 * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.x += p.vx * dt + Math.sin(elapsed / 1000 + p.drift) * 30 * dt;
                p.y += p.vy * dt;
                p.rotation += p.rotationSpeed * dt;

                // Fade out in last 20% of duration
                const fadeStart = duration * 0.8;
                if (elapsed > fadeStart) {
                    p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (duration * 0.2));
                }

                // Remove if off screen
                if (p.y > canvas.height + 50 || p.opacity <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                activeParticles++;

                // Draw
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;

                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
                }

                ctx.restore();
            }

            if (elapsed < duration || activeParticles > 0) {
                requestAnimationFrame(animate);
            } else {
                if (canvas.parentNode) {
                    canvas.remove();
                }
            }
        }

        requestAnimationFrame(animate);

        // Safety cleanup — ensure canvas is removed even if animation glitches
        setTimeout(() => {
            if (canvas.parentNode) {
                canvas.remove();
            }
        }, duration + 1000);
    }
}

export { UIController };
