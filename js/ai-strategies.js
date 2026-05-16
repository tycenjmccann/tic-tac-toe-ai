/**
 * AI Strategy Implementations for Tic-Tac-Toe
 * 
 * This module provides three AI difficulty levels:
 * - Easy: Random move selection
 * - Medium: Basic strategic moves (win, block, center preference)
 * - Hard: Optimal play using minimax with alpha-beta pruning
 */

/**
 * Base class for AI strategies
 * Provides common interface for all difficulty levels
 */
class AIStrategy {
    constructor(aiSymbol = 'O', playerSymbol = 'X') {
        this.aiSymbol = aiSymbol;
        this.playerSymbol = playerSymbol;
    }

    /**
     * Calculate the best move for the AI
     * @param {Array<string|null>} board - Current board state (9 cells)
     * @returns {number} Index of the best move (0-8)
     */
    getMove(board) {
        throw new Error('getMove() must be implemented by subclass');
    }

    /**
     * Get available empty cells
     * @param {Array<string|null>} board - Current board state
     * @returns {Array<number>} Array of empty cell indices
     */
    getAvailableMoves(board) {
        return board.map((cell, index) => cell === null ? index : null)
                   .filter(index => index !== null);
    }

    /**
     * Check if a player has won
     * @param {Array<string|null>} board - Current board state
     * @param {string} symbol - Player symbol to check
     * @returns {boolean} True if player has won
     */
    checkWin(board, symbol) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        return winPatterns.some(pattern => 
            pattern.every(index => board[index] === symbol)
        );
    }

    /**
     * Check if the board is full (draw)
     * @param {Array<string|null>} board - Current board state
     * @returns {boolean} True if board is full
     */
    isBoardFull(board) {
        return board.every(cell => cell !== null);
    }
}

/**
 * Easy AI - Random Move Selection
 * Makes completely random moves from available cells
 * Performance: < 100ms
 */
class EasyAI extends AIStrategy {
    /**
     * Get a random move from available cells
     * @param {Array<string|null>} board - Current board state
     * @returns {number} Random empty cell index
     */
    getMove(board) {
        const availableMoves = this.getAvailableMoves(board);
        
        if (availableMoves.length === 0) {
            throw new Error('No available moves');
        }

        // Select random move
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }
}

/**
 * Medium AI - Basic Strategic Play
 * Strategy priority:
 * 1. Take winning move if available
 * 2. Block opponent's winning move
 * 3. Take center if available
 * 4. Random move from remaining cells
 * Performance: < 200ms
 */
class MediumAI extends AIStrategy {
    /**
     * Get best move using basic strategy
     * @param {Array<string|null>} board - Current board state
     * @returns {number} Best strategic move index
     */
    getMove(board) {
        const availableMoves = this.getAvailableMoves(board);
        
        if (availableMoves.length === 0) {
            throw new Error('No available moves');
        }

        // Priority 1: Take winning move
        const winMove = this.findWinningMove(board, this.aiSymbol);
        if (winMove !== null) {
            return winMove;
        }

        // Priority 2: Block opponent's winning move
        const blockMove = this.findWinningMove(board, this.playerSymbol);
        if (blockMove !== null) {
            return blockMove;
        }

        // Priority 3: Take center if available
        if (board[4] === null) {
            return 4;
        }

        // Priority 4: Random move
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    /**
     * Find a winning move for the given symbol
     * @param {Array<string|null>} board - Current board state
     * @param {string} symbol - Symbol to check for winning move
     * @returns {number|null} Winning move index or null if none exists
     */
    findWinningMove(board, symbol) {
        const availableMoves = this.getAvailableMoves(board);

        for (const move of availableMoves) {
            // Try the move
            const testBoard = [...board];
            testBoard[move] = symbol;

            // Check if this move wins
            if (this.checkWin(testBoard, symbol)) {
                return move;
            }
        }

        return null;
    }
}

/**
 * Hard AI - Minimax Algorithm with Alpha-Beta Pruning
 * Plays optimally, never loses (only wins or draws)
 * Uses minimax algorithm to evaluate all possible game states
 * Performance: < 500ms with alpha-beta pruning optimization
 */
class HardAI extends AIStrategy {
    /**
     * Get optimal move using minimax algorithm
     * @param {Array<string|null>} board - Current board state
     * @returns {number} Optimal move index
     */
    getMove(board) {
        const availableMoves = this.getAvailableMoves(board);
        
        if (availableMoves.length === 0) {
            throw new Error('No available moves');
        }

        // Optimization: If board is empty, take center
        if (availableMoves.length === 9) {
            return 4;
        }

        // Optimization: If only one move left, take it
        if (availableMoves.length === 1) {
            return availableMoves[0];
        }

        let bestScore = -Infinity;
        let bestMove = availableMoves[0];

        // Evaluate each available move
        for (const move of availableMoves) {
            const testBoard = [...board];
            testBoard[move] = this.aiSymbol;

            // Use minimax with alpha-beta pruning
            const score = this.minimax(testBoard, 0, false, -Infinity, Infinity);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     * @param {Array<string|null>} board - Current board state
     * @param {number} depth - Current depth in game tree
     * @param {boolean} isMaximizing - True if maximizing player's turn
     * @param {number} alpha - Alpha value for pruning
     * @param {number} beta - Beta value for pruning
     * @returns {number} Score for this board state
     */
    minimax(board, depth, isMaximizing, alpha, beta) {
        // Terminal state evaluation
        if (this.checkWin(board, this.aiSymbol)) {
            return 10 - depth; // Prefer faster wins
        }
        if (this.checkWin(board, this.playerSymbol)) {
            return depth - 10; // Prefer slower losses (though shouldn't happen)
        }
        if (this.isBoardFull(board)) {
            return 0; // Draw
        }

        const availableMoves = this.getAvailableMoves(board);

        if (isMaximizing) {
            // AI's turn - maximize score
            let maxScore = -Infinity;

            for (const move of availableMoves) {
                const testBoard = [...board];
                testBoard[move] = this.aiSymbol;

                const score = this.minimax(testBoard, depth + 1, false, alpha, beta);
                maxScore = Math.max(maxScore, score);

                // Alpha-beta pruning
                alpha = Math.max(alpha, score);
                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }

            return maxScore;
        } else {
            // Player's turn - minimize score
            let minScore = Infinity;

            for (const move of availableMoves) {
                const testBoard = [...board];
                testBoard[move] = this.playerSymbol;

                const score = this.minimax(testBoard, depth + 1, true, alpha, beta);
                minScore = Math.min(minScore, score);

                // Alpha-beta pruning
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }

            return minScore;
        }
    }
}

/**
 * AI Strategy Factory
 * Creates appropriate AI instance based on difficulty level
 */
class AIStrategyFactory {
    /**
     * Create AI strategy instance
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     * @param {string} aiSymbol - Symbol for AI player (default: 'O')
     * @param {string} playerSymbol - Symbol for human player (default: 'X')
     * @returns {AIStrategy} AI strategy instance
     */
    static createAI(difficulty, aiSymbol = 'O', playerSymbol = 'X') {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return new EasyAI(aiSymbol, playerSymbol);
            case 'medium':
                return new MediumAI(aiSymbol, playerSymbol);
            case 'hard':
                return new HardAI(aiSymbol, playerSymbol);
            default:
                throw new Error(`Unknown difficulty level: ${difficulty}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AIStrategy,
        EasyAI,
        MediumAI,
        HardAI,
        AIStrategyFactory
    };
}
