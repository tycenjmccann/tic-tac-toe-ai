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
        this.currentFocusIndex = 0;
        this.lastFocusedDifficultyBtn = null;
        
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
        this.initRovingTabindex();
        this.initDifficultyTabindex();
        this.attachEventListeners();
        this.updateUI();
        this.updateDifficultyUI();
        this.updateStats();
    }

    /**
     * Initialize roving tabindex on game board cells
     */
    initRovingTabindex() {
        this.elements.cells.forEach((cell, i) => {
            cell.setAttribute('tabindex', i === this.currentFocusIndex ? '0' : '-1');
        });
    }

    /**
     * Initialize tabindex on difficulty buttons (radio group pattern)
     */
    initDifficultyTabindex() {
        const activeBtn = document.querySelector('.difficulty-btn.active');
        this.elements.difficultyButtons.forEach(btn => {
            btn.setAttribute('tabindex', btn === activeBtn ? '0' : '-1');
        });
    }

    /**
     * Set the active cell in the roving tabindex
     * @param {number} index - Cell index to make active
     */
    setActiveCell(index) {
        this.elements.cells.forEach((cell, i) => {
            cell.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        this.currentFocusIndex = index;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Cell click events
        this.elements.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // New game button
        this.elements.newGameBtn.addEventListener('click', () => this.handleNewGame());

        // Reset stats button
        this.elements.resetStatsBtn.addEventListener('click', () => this.handleResetStats());

        // Difficulty selection (click)
        this.elements.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.getAttribute('data-difficulty');
                this.handleDifficultyChange(difficulty);
            });

            // Keyboard support for difficulty buttons
            btn.addEventListener('keydown', (e) => this.handleDifficultyKeydown(e, btn));
        });

        // Modal events
        this.elements.modalConfirm.addEventListener('click', () => this.confirmDifficultyChange());
        this.elements.modalCancel.addEventListener('click', () => this.cancelDifficultyChange());

        // Modal focus trap
        this.elements.modalConfirm.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.elements.modalCancel.focus();
            }
        });
        this.elements.modalCancel.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.elements.modalConfirm.focus();
            }
        });

        // Global keyboard event handler
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }

    /**
     * Handle global keydown events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleGlobalKeydown(e) {
        // Escape to close modal
        if (e.key === 'Escape' && !this.elements.modal.hidden) {
            this.cancelDifficultyChange();
            return;
        }

        // 'N' shortcut for new game
        if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const activeEl = document.activeElement;
            const isTextInput = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (this.elements.modal.hidden && !isTextInput) {
                e.preventDefault();
                this.handleNewGame();
                return;
            }
        }

        // Grid keyboard navigation (only when a cell is focused)
        const focusedElement = document.activeElement;
        const focusedIndex = Array.from(this.elements.cells).indexOf(focusedElement);
        if (focusedIndex !== -1) {
            this.handleGridKeydown(e, focusedIndex);
        }
    }

    /**
     * Handle keyboard navigation within the grid
     * @param {KeyboardEvent} e - Keyboard event
     * @param {number} focusedIndex - Currently focused cell index
     */
    handleGridKeydown(e, focusedIndex) {
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
            case 'Home':
                newIndex = focusedIndex - (focusedIndex % 3);
                break;
            case 'End':
                newIndex = focusedIndex + (2 - focusedIndex % 3);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handleCellClick(focusedIndex);
                return;
            default:
                return;
        }

        if (newIndex !== focusedIndex) {
            e.preventDefault();
            this.setActiveCell(newIndex);
            this.elements.cells[newIndex].focus();
        } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            // Prevent default even if at boundary to avoid page scroll
            e.preventDefault();
        }
    }

    /**
     * Handle keyboard navigation for difficulty buttons (radio group pattern)
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} currentBtn - Currently focused button
     */
    handleDifficultyKeydown(e, currentBtn) {
        const buttons = Array.from(this.elements.difficultyButtons);
        const currentIndex = buttons.indexOf(currentBtn);
        let newIndex;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                newIndex = (currentIndex + 1) % buttons.length; // wraps
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                newIndex = (currentIndex - 1 + buttons.length) % buttons.length; // wraps
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const difficulty = currentBtn.getAttribute('data-difficulty');
                this.handleDifficultyChange(difficulty);
                return;
            default:
                return;
        }

        e.preventDefault();
        buttons[currentIndex].setAttribute('tabindex', '-1');
        buttons[newIndex].setAttribute('tabindex', '0');
        buttons[newIndex].focus();

        // Activate the focused difficulty (radio group pattern: focus = select)
        const difficulty = buttons[newIndex].getAttribute('data-difficulty');
        this.handleDifficultyChange(difficulty);
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
        } else if (this.game.isGameOver) {
            // Game ended on player's move (player won or draw)
            setTimeout(() => {
                this.elements.newGameBtn.focus();
            }, 500);
        }
    }

    /**
     * Make AI move with delay for better UX
     */
    async makeAIMove() {
        this.isAIThinking = true;
        const previousFocusIndex = this.currentFocusIndex;
        this.updateStatusMessage('AI is thinking...');

        // Small delay to show "thinking" state
        await this.delay(300);

        const aiMove = this.game.getAIMove();
        if (aiMove !== null) {
            this.game.makeMove(aiMove, 'O');
            this.updateUI();
        }

        this.isAIThinking = false;

        // Focus management after AI move
        if (this.game.isGameOver) {
            // Game over: focus New Game button after delay for status announcement
            setTimeout(() => {
                this.elements.newGameBtn.focus();
            }, 500);
        } else {
            // Game continues: return focus to last focused cell or first empty
            let targetIndex = previousFocusIndex;
            if (this.game.board[targetIndex] !== null) {
                targetIndex = this.game.board.findIndex(cell => cell === null);
            }
            if (targetIndex >= 0) {
                this.setActiveCell(targetIndex);
                this.elements.cells[targetIndex].focus();
            }
        }
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
        
        // Focus center cell on new game
        this.setActiveCell(4);
        this.elements.cells[4].focus();

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
            this.lastFocusedDifficultyBtn = document.activeElement;
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
        // Focus center cell after difficulty change
        this.setActiveCell(4);
        this.elements.cells[4].focus();
    }

    /**
     * Cancel difficulty change
     */
    cancelDifficultyChange() {
        this.hideModal();
        // Return focus to the triggering difficulty button
        if (this.lastFocusedDifficultyBtn && this.lastFocusedDifficultyBtn.classList.contains('difficulty-btn')) {
            this.lastFocusedDifficultyBtn.focus();
        }
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

            // Update ARIA label with row/column format
            const row = Math.floor(index / 3) + 1;
            const col = (index % 3) + 1;
            if (value) {
                cell.setAttribute('aria-label', `Row ${row}, Column ${col}: ${value}`);
            } else {
                cell.setAttribute('aria-label', `Row ${row}, Column ${col}: empty`);
            }
        });

        // Maintain roving tabindex after UI update
        this.setActiveCell(this.currentFocusIndex);

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
            // Roving tabindex: only active button is tabbable
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
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
