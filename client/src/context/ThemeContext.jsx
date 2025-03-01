import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, setTheme as setThemeUtil } from '../utils/themeUtils';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getTheme());
  const { isAuthenticated } = useAuth();
  const { settings, updateSetting, saveUserSettings } = useSettings();
  
  // Set the theme in the DOM when it changes
  useEffect(() => {
    setThemeUtil(theme);
    
    // Update settings context with the new theme
    updateSetting('darkMode', theme === 'dark');
    
    // Save to server if authenticated
    if (isAuthenticated) {
      saveUserSettings().catch(error => {
        console.error('Error saving theme to server:', error);
      });
    }
  }, [theme, isAuthenticated]);
  
  // Sync with settings context when it changes
  useEffect(() => {
    const newTheme = settings.darkMode ? 'dark' : 'light';
    if (theme !== newTheme) {
      setThemeState(newTheme);
    }
  }, [settings.darkMode]);
  
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
