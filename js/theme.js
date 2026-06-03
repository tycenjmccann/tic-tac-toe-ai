/**
 * Theme Manager Module
 * Handles dark/light mode toggle with localStorage persistence
 */

export class ThemeManager {
    constructor() {
        this.storageKey = 'tic-tac-toe-theme';
        this.toggleBtn = document.getElementById('theme-toggle');
        this.currentTheme = this.getInitialTheme();
        
        this.applyTheme(this.currentTheme);
        this.updateToggleButton();
        this.bindEvents();
    }

    /**
     * Determine initial theme from storage or OS preference
     */
    getInitialTheme() {
        // Check localStorage first
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored === 'dark' || stored === 'light') {
                return stored;
            }
        } catch (e) {
            // localStorage unavailable — fall through
        }

        // Check OS preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // Default to light
        return 'light';
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    /**
     * Update toggle button icon and aria-label
     */
    updateToggleButton() {
        if (!this.toggleBtn) return;
        
        if (this.currentTheme === 'dark') {
            this.toggleBtn.setAttribute('aria-label', 'Switch to light mode');
            this.toggleBtn.setAttribute('title', 'Switch to light mode');
        } else {
            this.toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
            this.toggleBtn.setAttribute('title', 'Switch to dark mode');
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        
        // Add transition class for smooth animation
        document.documentElement.classList.add('theme-transitioning');
        
        // Add spin animation to button
        if (this.toggleBtn) {
            this.toggleBtn.classList.add('animating');
            this.toggleBtn.addEventListener('animationend', () => {
                this.toggleBtn.classList.remove('animating');
            }, { once: true });
        }
        
        this.applyTheme(newTheme);
        this.updateToggleButton();
        this.saveTheme(newTheme);
        
        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 350);
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            // localStorage unavailable — graceful degradation
            console.warn('Unable to save theme preference:', e);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle button click
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Listen for OS theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only react if user hasn't explicitly set a preference
                try {
                    const stored = localStorage.getItem(this.storageKey);
                    if (stored) return; // User has explicit preference, don't override
                } catch (err) {
                    // If localStorage unavailable, respect OS change
                }
                
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.classList.add('theme-transitioning');
                this.applyTheme(newTheme);
                this.updateToggleButton();
                setTimeout(() => {
                    document.documentElement.classList.remove('theme-transitioning');
                }, 350);
            });
        }
    }
}
