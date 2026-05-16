/**
 * UI Controller for Tic-Tac-Toe Game
 * 
 * Manages DOM manipulation, event handling, and UI updates
 */

class GameUI {
    constructor() {
        this.game = null;
        this.cells = [];
        this.isProcessing = false; // Prevent multiple moves during AI turn
        
        // Initialize game with default difficulty from localStorage or 'medium'
        const savedDifficulty = localStorage.getItem('tictactoe-difficulty') || 'medium';
        this.initGame(savedDifficulty);
        
        // Get DOM elements
        this.boardElement = document.getElementById('game-board');
        this.statusElement = document.getElementById('game-status');
        this.resetButton = document.getElementById('reset-button');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        // Initialize UI
        this.setupEventListeners();
        this.renderBoard();
        this.updateStatus();
        this.updateDifficultyButtons();
    }

    /**
     * Initialize game with specified difficulty
     * @param {string} difficulty - Difficulty level
     */
    initGame(difficulty) {
        this.game = new TicTacToeGame(difficulty);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Board cell clicks
        this.boardElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const index = parseInt(e.target.dataset.index);
                this.handleCellClick(index);
            }
        });

        // Reset button
        this.resetButton.addEventListener('click', () => {
            this.resetGame();
        });

        // Difficulty buttons
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.dataset.difficulty;
                this.changeDifficulty(difficulty);
            });
        });
    }

    /**
     * Handle cell click event
     * @param {number} index - Cell index
     */
    async handleCellClick(index) {
        // Prevent moves during AI turn or when game is over
        if (this.isProcessing || this.game.isGameOver() || this.game.isAITurn()) {
            return;
        }

        // Make player move
        const moveSuccess = this.game.makeMove(index);
        
        if (!moveSuccess) {
            return;
        }

        // Update UI
        this.renderBoard();
        this.updateStatus();

        // Check if game is over
        if (this.game.isGameOver()) {
            this.showGameOver();
            return;
        }

        // AI's turn
        if (this.game.isAITurn()) {
            this.isProcessing = true;
            this.showAIThinking();
            
            try {
                await this.game.makeAIMove();
                this.renderBoard();
                this.updateStatus();
                
                if (this.game.isGameOver()) {
                    this.showGameOver();
                }
            } finally {
                this.isProcessing = false;
            }
        }
    }

    /**
     * Render the game board
     */
    renderBoard() {
        const state = this.game.getState();
        
        // Clear board
        this.boardElement.innerHTML = '';
        
        // Create cells
        state.board.forEach((value, index) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = index;
            
            if (value) {
                cell.textContent = value;
                cell.classList.add('taken');
                cell.classList.add(value === 'X' ? 'player-x' : 'player-o');
            }
            
            // Highlight winning combination
            if (state.winningCombination && state.winningCombination.includes(index)) {
                cell.classList.add('winner');
            }
            
            this.boardElement.appendChild(cell);
        });
        
        this.cells = Array.from(this.boardElement.querySelectorAll('.cell'));
    }

    /**
     * Update status message
     */
    updateStatus() {
        const state = this.game.getState();
        
        if (state.gameOver) {
            if (state.winner === 'draw') {
                this.statusElement.textContent = "It's a draw!";
                this.statusElement.className = 'game-status draw';
            } else if (state.winner === 'X') {
                this.statusElement.textContent = "You win! 🎉";
                this.statusElement.className = 'game-status win';
            } else {
                this.statusElement.textContent = "AI wins!";
                this.statusElement.className = 'game-status lose';
            }
        } else {
            if (state.currentPlayer === 'X') {
                this.statusElement.textContent = "Your turn (X)";
                this.statusElement.className = 'game-status';
            } else {
                this.statusElement.textContent = "AI's turn (O)";
                this.statusElement.className = 'game-status ai-turn';
            }
        }
    }

    /**
     * Show AI thinking indicator
     */
    showAIThinking() {
        this.statusElement.textContent = "AI is thinking...";
        this.statusElement.className = 'game-status ai-thinking';
    }

    /**
     * Show game over message
     */
    showGameOver() {
        const state = this.game.getState();
        
        // Add game over class to board
        this.boardElement.classList.add('game-over');
        
        // Log AI performance (for debugging)
        if (state.aiMoveTime > 0) {
            console.log(`AI move time: ${state.aiMoveTime.toFixed(2)}ms (${state.difficulty} difficulty)`);
        }
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.game.reset();
        this.boardElement.classList.remove('game-over');
        this.isProcessing = false;
        this.renderBoard();
        this.updateStatus();
    }

    /**
     * Change difficulty level
     * @param {string} difficulty - New difficulty level
     */
    changeDifficulty(difficulty) {
        // Confirm if game is in progress
        if (!this.game.isGameOver() && this.game.getState().board.some(cell => cell !== null)) {
            if (!confirm('Changing difficulty will start a new game. Continue?')) {
                return;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('tictactoe-difficulty', difficulty);
        
        // Create new game with new difficulty
        this.initGame(difficulty);
        this.resetGame();
        this.updateDifficultyButtons();
        
        // Show notification
        this.showDifficultyNotification(difficulty);
    }

    /**
     * Update difficulty button states
     */
    updateDifficultyButtons() {
        const currentDifficulty = this.game.getDifficulty();
        
        this.difficultyButtons.forEach(button => {
            if (button.dataset.difficulty === currentDifficulty) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Show difficulty change notification
     * @param {string} difficulty - New difficulty level
     */
    showDifficultyNotification(difficulty) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `Difficulty set to ${difficulty.toUpperCase()}`;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const gameUI = new GameUI();
    
    // Make gameUI available globally for debugging
    window.gameUI = gameUI;
});
