/**
 * Game State Management
 * Handles game logic, state, and AI integration
 */

import { AIStrategyFactory } from './ai-strategies.js';

/**
 * Game class - Core game logic and state management
 */
class Game {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X'; // Human always plays X
        this.aiPlayer = 'O';
        this.isGameOver = false;
        this.winner = null;
        this.winningCombination = null;
        this.difficulty = this.loadDifficulty();
        this.ai = AIStrategyFactory.create(this.difficulty, this.aiPlayer);
        this.stats = this.loadStats();
        this.moveHistory = [];
    }

    /**
     * Win patterns for tic-tac-toe
     */
    static get WIN_PATTERNS() {
        return [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
    }

    /**
     * Load difficulty from localStorage
     * @returns {string} Difficulty level
     */
    loadDifficulty() {
        const stored = localStorage.getItem('tic-tac-toe-difficulty');
        return stored || 'medium'; // Default to medium
    }

    /**
     * Save difficulty to localStorage
     * @param {string} difficulty - Difficulty level to save
     */
    saveDifficulty(difficulty) {
        localStorage.setItem('tic-tac-toe-difficulty', difficulty);
        this.difficulty = difficulty;
    }

    /**
     * Load game stats from localStorage
     * @returns {Object} Stats object with wins, losses, draws
     */
    loadStats() {
        const stored = localStorage.getItem('tic-tac-toe-stats');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading stats:', e);
            }
        }
        return { wins: 0, losses: 0, draws: 0 };
    }

    /**
     * Save game stats to localStorage
     */
    saveStats() {
        localStorage.setItem('tic-tac-toe-stats', JSON.stringify(this.stats));
    }

    /**
     * Reset all stats
     */
    resetStats() {
        this.stats = { wins: 0, losses: 0, draws: 0 };
        this.saveStats();
    }

    /**
     * Change difficulty level
     * @param {string} newDifficulty - New difficulty level
     */
    changeDifficulty(newDifficulty) {
        this.saveDifficulty(newDifficulty);
        this.ai = AIStrategyFactory.create(newDifficulty, this.aiPlayer);
        this.difficulty = newDifficulty;
    }

    /**
     * Make a move on the board
     * @param {number} index - Cell index (0-8)
     * @param {string} player - Player making the move ('X' or 'O')
     * @returns {boolean} True if move was valid
     */
    makeMove(index, player) {
        // Validate move
        if (this.isGameOver || this.board[index] !== null || index < 0 || index > 8) {
            return false;
        }

        // Make the move
        this.board[index] = player;
        this.moveHistory.push({ index, player });

        // Check for game over
        this.checkGameOver();

        // Switch player if game is not over
        if (!this.isGameOver) {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }

        return true;
    }

    /**
     * Get AI move
     * @returns {number|null} Index of AI's chosen move
     */
    getAIMove() {
        if (this.isGameOver) {
            return null;
        }

        const startTime = performance.now();
        const move = this.ai.getMove(this.board);
        const endTime = performance.now();

        console.log(`AI (${this.difficulty}) took ${(endTime - startTime).toFixed(2)}ms to decide`);

        return move;
    }

    /**
     * Check if game is over (win or draw)
     */
    checkGameOver() {
        // Check for winner
        const winner = this.checkWinner();
        if (winner) {
            this.isGameOver = true;
            this.winner = winner.player;
            this.winningCombination = winner.combination;
            this.updateStats(winner.player);
            return;
        }

        // Check for draw
        if (this.board.every(cell => cell !== null)) {
            this.isGameOver = true;
            this.winner = 'draw';
            this.updateStats('draw');
        }
    }

    /**
     * Check for a winner
     * @returns {Object|null} Object with player and winning combination, or null
     */
    checkWinner() {
        for (const pattern of Game.WIN_PATTERNS) {
            const [a, b, c] = pattern;
            if (
                this.board[a] !== null &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]
            ) {
                return {
                    player: this.board[a],
                    combination: pattern
                };
            }
        }
        return null;
    }

    /**
     * Update game statistics
     * @param {string} result - Result of the game ('X', 'O', or 'draw')
     */
    updateStats(result) {
        if (result === 'X') {
            this.stats.wins++;
        } else if (result === 'O') {
            this.stats.losses++;
        } else if (result === 'draw') {
            this.stats.draws++;
        }
        this.saveStats();
    }

    /**
     * Reset the game
     */
    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.isGameOver = false;
        this.winner = null;
        this.winningCombination = null;
        this.moveHistory = [];
    }

    /**
     * Get current game state
     * @returns {Object} Current game state
     */
    getState() {
        return {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            isGameOver: this.isGameOver,
            winner: this.winner,
            winningCombination: this.winningCombination,
            difficulty: this.difficulty,
            stats: { ...this.stats },
            moveCount: this.moveHistory.length
        };
    }

    /**
     * Check if it's AI's turn
     * @returns {boolean} True if AI should move
     */
    isAITurn() {
        return !this.isGameOver && this.currentPlayer === this.aiPlayer;
    }

    /**
     * Check if it's human's turn
     * @returns {boolean} True if human can move
     */
    isHumanTurn() {
        return !this.isGameOver && this.currentPlayer === 'X';
    }
}

export { Game };
