/**
 * Theme utility functions for handling dark/light mode
 */

/**
 * Check if the user prefers dark mode based on system preferences
 * @returns {boolean} True if the user prefers dark mode
 */
export const prefersDarkMode = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get the current theme from localStorage or system preference
 * @returns {string} 'dark' or 'light'
 */
export const getTheme = () => {
  // Check if theme is stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme) {
    return storedTheme;
  }
  
  // If no stored preference, use system preference
  return prefersDarkMode() ? 'dark' : 'light';
};

/**
 * Set the theme and update localStorage and document class
 * @param {string} theme - 'dark' or 'light'
 */
export const setTheme = (theme) => {
  // Store the preference
  localStorage.setItem('theme', theme);
  
  // Update document class
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

/**
 * Toggle between dark and light mode
 */
export const toggleTheme = () => {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
};

/**
 * Initialize theme based on stored preference or system preference
 * Call this function when the app loads
 */
export const initializeTheme = () => {
  const theme = getTheme();
  setTheme(theme);
};
