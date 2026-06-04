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
        this.gameEpoch = 0;
        
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
            modalCancel: document.getElementById('modal-cancel')
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
        const epoch = this.gameEpoch;
        this.isAIThinking = true;
        this.updateStatusMessage('AI is thinking...');

        // Small delay to show "thinking" state
        await this.delay(300);

        // If game was reset during the delay, discard this stale move
        if (epoch !== this.gameEpoch) {
            return;
        }

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
        this.gameEpoch++;
        this.isAIThinking = false;
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
        this.gameEpoch++;
        this.isAIThinking = false;
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
                this.elements.statusMessage.textContent = '🎉 You won!';
            } else if (state.winner === 'O') {
                this.elements.statusMessage.textContent = '😔 AI won!';
            } else {
                this.elements.statusMessage.textContent = '🤝 It\'s a draw!';
            }
        } else {
            if (state.currentPlayer === 'X') {
                this.elements.statusMessage.textContent = 'Your turn (X)';
            } else {
                this.elements.statusMessage.textContent = 'AI\'s turn (O)';
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
}

export { UIController };