import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, setTheme as setThemeUtil } from '../utils/themeUtils';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getTheme());
  
  // Set the theme in the DOM when it changes
  useEffect(() => {
    setThemeUtil(theme);
  }, [theme]);
  
  // Function to toggle between dark and light mode
  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      return newTheme;
    });
  };
  
  // Function to set a specific theme
  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };
  
  // Context value
  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
