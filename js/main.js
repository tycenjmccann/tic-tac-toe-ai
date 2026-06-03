/**
 * Main Application Entry Point
 * Initializes the Tic-Tac-Toe game with AI
 */

import { UIController } from './ui.js';

/**
 * Initialize the application when DOM is ready
 */
function init() {
    console.log('🎮 Initializing Tic-Tac-Toe vs AI...');
    
    try {
        // Create UI controller (which creates the game)
        const ui = new UIController();
        
        console.log('✅ Game initialized successfully!');
        console.log('Current difficulty:', ui.game.difficulty);
        console.log('Stats:', ui.game.stats);
        
        // Make UI controller available globally for debugging
        if (typeof window !== 'undefined') {
            window.game = ui.game;
            window.ui = ui;
        }
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        
        // Show user-friendly error message
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = '⚠️ Error loading game. Please refresh the page.';
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
        console.log('📴 Page hidden');
    } else {
        console.log('👀 Page visible');
    }
});

// Export init for testing purposes
export { init };