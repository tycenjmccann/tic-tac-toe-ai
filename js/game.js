/**
 * Tic-Tac-Toe Game Logic
 * 
 * Manages game state, turn logic, win detection, and AI integration
 */

class TicTacToeGame {
    constructor(difficulty = 'medium') {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X'; // Human plays first
        this.playerSymbol = 'X';
        this.aiSymbol = 'O';
        this.difficulty = difficulty;
        this.gameOver = false;
        this.winner = null;
        this.winningCombination = null;
        
        // Create AI strategy
        this.ai = AIStrategyFactory.createAI(difficulty, this.aiSymbol, this.playerSymbol);
        
        // Performance tracking
        this.aiMoveTime = 0;
    }

    /**
     * Reset the game to initial state
     */
    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.winningCombination = null;
        this.aiMoveTime = 0;
    }

    /**
     * Change difficulty level and reset AI
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.ai = AIStrategyFactory.createAI(difficulty, this.aiSymbol, this.playerSymbol);
    }

    /**
     * Make a move at the specified position
     * @param {number} position - Board position (0-8)
     * @returns {boolean} True if move was valid
     */
    makeMove(position) {
        // Validate move
        if (this.gameOver || this.board[position] !== null) {
            return false;
        }

        // Make the move
        this.board[position] = this.currentPlayer;

        // Check for win or draw
        if (this.checkWin(this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            return true;
        }

        if (this.checkDraw()) {
            this.gameOver = true;
            this.winner = 'draw';
            return true;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        return true;
    }

    /**
     * Get AI move and execute it
     * @returns {Promise<number>} Position where AI moved
     */
    async makeAIMove() {
        if (this.gameOver || this.currentPlayer !== this.aiSymbol) {
            return null;
        }

        // Track performance
        const startTime = performance.now();

        // Get AI move (with small delay for UX)
        const move = await new Promise(resolve => {
            setTimeout(() => {
                const aiMove = this.ai.getMove(this.board);
                resolve(aiMove);
            }, 300); // Small delay for visual feedback
        });

        this.aiMoveTime = performance.now() - startTime;

        // Make the move
        this.makeMove(move);

        return move;
    }

    /**
     * Check if current player has won
     * @param {string} symbol - Player symbol to check
     * @returns {boolean} True if player has won
     */
    checkWin(symbol) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (const pattern of winPatterns) {
            if (pattern.every(index => this.board[index] === symbol)) {
                this.winningCombination = pattern;
                return true;
            }
        }

        return false;
    }

    /**
     * Check if game is a draw
     * @returns {boolean} True if game is a draw
     */
    checkDraw() {
        return this.board.every(cell => cell !== null) && !this.winner;
    }

    /**
     * Get current game state
     * @returns {Object} Game state object
     */
    getState() {
        return {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            winningCombination: this.winningCombination,
            difficulty: this.difficulty,
            aiMoveTime: this.aiMoveTime
        };
    }

    /**
     * Get available moves
     * @returns {Array<number>} Array of available positions
     */
    getAvailableMoves() {
        return this.board.map((cell, index) => cell === null ? index : null)
                        .filter(index => index !== null);
    }

    /**
     * Check if it's AI's turn
     * @returns {boolean} True if AI should move
     */
    isAITurn() {
        return !this.gameOver && this.currentPlayer === this.aiSymbol;
    }

    /**
     * Check if game is over
     * @returns {boolean} True if game has ended
     */
    isGameOver() {
        return this.gameOver;
    }

    /**
     * Get winner
     * @returns {string|null} Winner symbol, 'draw', or null if game ongoing
     */
    getWinner() {
        return this.winner;
    }

    /**
     * Get current difficulty
     * @returns {string} Current difficulty level
     */
    getDifficulty() {
        return this.difficulty;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TicTacToeGame;
}
