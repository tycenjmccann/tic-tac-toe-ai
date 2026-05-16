/**
 * AI Strategies for Tic-Tac-Toe
 * Implements three difficulty levels: Easy, Medium, and Hard
 */

/**
 * Base AI Strategy class
 * Provides common utility methods for all AI implementations
 */
class AIStrategy {
    constructor(player = 'O') {
        this.player = player;
        this.opponent = player === 'O' ? 'X' : 'O';
    }

    /**
     * Get all empty cells on the board
     * @param {Array} board - Current game board state
     * @returns {Array} Array of empty cell indices
     */
    getEmptyCells(board) {
        return board
            .map((cell, index) => cell === null ? index : null)
            .filter(index => index !== null);
    }

    /**
     * Check if a player has won
     * @param {Array} board - Current game board state
     * @param {string} player - Player to check ('X' or 'O')
     * @returns {boolean} True if player has won
     */
    checkWin(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        return winPatterns.some(pattern =>
            pattern.every(index => board[index] === player)
        );
    }

    /**
     * Check if the board is full (draw condition)
     * @param {Array} board - Current game board state
     * @returns {boolean} True if board is full
     */
    isBoardFull(board) {
        return board.every(cell => cell !== null);
    }

    /**
     * Find a winning move for a specific player
     * @param {Array} board - Current game board state
     * @param {string} player - Player to check
     * @returns {number|null} Index of winning move or null
     */
    findWinningMove(board, player) {
        const emptyCells = this.getEmptyCells(board);

        for (const cell of emptyCells) {
            const boardCopy = [...board];
            boardCopy[cell] = player;
            
            if (this.checkWin(boardCopy, player)) {
                return cell;
            }
        }

        return null;
    }

    /**
     * Abstract method to be implemented by subclasses
     * @param {Array} board - Current game board state
     * @returns {number} Index of the chosen move
     */
    getMove(board) {
        throw new Error('getMove() must be implemented by subclass');
    }
}

/**
 * Easy AI Strategy - Random Moves
 * Makes completely random valid moves without any strategy
 */
class EasyAI extends AIStrategy {
    constructor(player = 'O') {
        super(player);
        this.difficulty = 'easy';
    }

    /**
     * Get a random valid move
     * @param {Array} board - Current game board state
     * @returns {number} Random empty cell index
     */
    getMove(board) {
        const emptyCells = this.getEmptyCells(board);
        
        if (emptyCells.length === 0) {
            return null;
        }

        // Return a random empty cell
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
}

/**
 * Medium AI Strategy - Basic Strategic Play
 * Implements basic strategy: win if possible, block opponent, prefer center
 */
class MediumAI extends AIStrategy {
    constructor(player = 'O') {
        super(player);
        this.difficulty = 'medium';
    }

    /**
     * Get a strategically sound move
     * Priority: Win > Block > Center > Random
     * @param {Array} board - Current game board state
     * @returns {number} Index of chosen move
     */
    getMove(board) {
        // 1. Try to win
        const winningMove = this.findWinningMove(board, this.player);
        if (winningMove !== null) {
            return winningMove;
        }

        // 2. Block opponent's winning move
        const blockingMove = this.findWinningMove(board, this.opponent);
        if (blockingMove !== null) {
            return blockingMove;
        }

        // 3. Take center if available
        if (board[4] === null) {
            return 4;
        }

        // 4. Take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => board[index] === null);
        if (availableCorners.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCorners.length);
            return availableCorners[randomIndex];
        }

        // 5. Take any available edge
        const emptyCells = this.getEmptyCells(board);
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }

        return null;
    }
}

/**
 * Hard AI Strategy - Minimax Algorithm
 * Implements unbeatable AI using minimax with alpha-beta pruning
 */
class HardAI extends AIStrategy {
    constructor(player = 'O') {
        super(player);
        this.difficulty = 'hard';
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     * @param {Array} board - Current game board state
     * @param {number} depth - Current recursion depth
     * @param {boolean} isMaximizing - True if maximizing player's turn
     * @param {number} alpha - Alpha value for pruning
     * @param {number} beta - Beta value for pruning
     * @returns {number} Score of the board state
     */
    minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        // Check terminal states
        if (this.checkWin(board, this.player)) {
            return 10 - depth; // Prefer faster wins
        }
        if (this.checkWin(board, this.opponent)) {
            return depth - 10; // Prefer slower losses
        }
        if (this.isBoardFull(board)) {
            return 0; // Draw
        }

        const emptyCells = this.getEmptyCells(board);

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const cell of emptyCells) {
                const boardCopy = [...board];
                boardCopy[cell] = this.player;
                
                const score = this.minimax(boardCopy, depth + 1, false, alpha, beta);
                maxScore = Math.max(maxScore, score);
                
                // Alpha-beta pruning
                alpha = Math.max(alpha, score);
                if (beta <= alpha) {
                    break;
                }
            }

            return maxScore;
        } else {
            let minScore = Infinity;

            for (const cell of emptyCells) {
                const boardCopy = [...board];
                boardCopy[cell] = this.opponent;
                
                const score = this.minimax(boardCopy, depth + 1, true, alpha, beta);
                minScore = Math.min(minScore, score);
                
                // Alpha-beta pruning
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break;
                }
            }

            return minScore;
        }
    }

    /**
     * Get the optimal move using minimax
     * @param {Array} board - Current game board state
     * @returns {number} Index of optimal move
     */
    getMove(board) {
        const emptyCells = this.getEmptyCells(board);
        
        if (emptyCells.length === 0) {
            return null;
        }

        // Optimization: If board is empty, take center
        if (emptyCells.length === 9) {
            return 4;
        }

        let bestScore = -Infinity;
        let bestMove = null;

        for (const cell of emptyCells) {
            const boardCopy = [...board];
            boardCopy[cell] = this.player;
            
            const score = this.minimax(boardCopy, 0, false);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = cell;
            }
        }

        return bestMove;
    }
}

/**
 * AI Strategy Factory
 * Creates the appropriate AI strategy based on difficulty level
 */
class AIStrategyFactory {
    /**
     * Create an AI strategy instance
     * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
     * @param {string} player - Player symbol ('X' or 'O')
     * @returns {AIStrategy} AI strategy instance
     */
    static create(difficulty, player = 'O') {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return new EasyAI(player);
            case 'medium':
                return new MediumAI(player);
            case 'hard':
                return new HardAI(player);
            default:
                console.warn(`Unknown difficulty: ${difficulty}, defaulting to medium`);
                return new MediumAI(player);
        }
    }
}

// Export for use in other modules
export { AIStrategy, EasyAI, MediumAI, HardAI, AIStrategyFactory };