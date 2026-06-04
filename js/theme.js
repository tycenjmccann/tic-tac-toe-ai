/**
 * Theme Controller
 * Manages light/dark theme switching with localStorage persistence
 */

/**
 * ThemeController class
 * Handles theme detection, switching, and persistence
 */
class ThemeController {
    constructor() {
        this.toggle = document.getElementById('theme-toggle');
        this.icon = this.toggle.querySelector('.theme-toggle-icon');
        this.currentTheme = this.getInitialTheme();

        this.applyTheme(this.currentTheme);
        this.attachEventListeners();
    }

    /**
     * Determine initial theme from localStorage or OS preference
     * @returns {string} 'dark' or 'light'
     */
    getInitialTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    /**
     * Apply theme to the document
     * @param {string} theme - 'dark' or 'light'
     */
    applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        this.updateToggleButton(theme);
        this.currentTheme = theme;
    }

    /**
     * Update toggle button icon and aria-label
     * @param {string} theme - Current theme
     */
    updateToggleButton(theme) {
        if (theme === 'light') {
            this.icon.textContent = '\u2600\uFE0F';
            this.toggle.setAttribute('aria-label', 'Switch to dark theme');
        } else {
            this.icon.textContent = '\uD83C\uDF19';
            this.toggle.setAttribute('aria-label', 'Switch to light theme');
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        // Enable transition for smooth switch (respects reduced motion)
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            document.documentElement.classList.add('theme-transition');

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 400);
        }

        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.toggle.addEventListener('click', () => this.toggleTheme());

        // Listen for OS theme changes (only if no stored preference)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
            }
        });
    }
}

export { ThemeController };
