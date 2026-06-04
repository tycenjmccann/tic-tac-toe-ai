/**
 * Main Application Entry Point
 * Initializes the Tic-Tac-Toe game with AI
 */

import { UIController } from './ui.js';
import { ThemeController } from './theme.js';

/**
 * Initialize the application when DOM is ready
 */
function init() {
    console.log('\uD83C\uDFAE Initializing Tic-Tac-Toe vs AI...');
    
    try {
        // Initialize theme controller
        const theme = new ThemeController();
        
        // Create UI controller (which creates the game)
        const ui = new UIController();
        
        console.log('\u2705 Game initialized successfully!');
        console.log('Current difficulty:', ui.game.difficulty);
        console.log('Stats:', ui.game.stats);
        
        // Make controllers available globally for debugging
        if (typeof window !== 'undefined') {
            window.game = ui.game;
            window.ui = ui;
            window.theme = theme;
        }
    } catch (error) {
        console.error('\u274C Error initializing game:', error);
        
        // Show user-friendly error message
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = '\u26A0\uFE0F Error loading game. Please refresh the page.';
            statusMessage.style.color = 'var(--danger-color)';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle page visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('\uD83D\uDCF4 Page hidden');
    } else {
        console.log('\uD83D\uDC40 Page visible');
    }
});

// Export init for testing purposes
export { init };
