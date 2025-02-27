import React, { createContext, useContext, useState, useEffect } from 'react';

// Default settings
const defaultSettings = {
  pollInterval: 30, // Default poll interval in seconds
  darkMode: false,
  notifications: true,
  batteryNotifications: true, // Notify when UPS goes on battery
  lowBatteryNotifications: true, // Notify when UPS battery is low
  discordWebhookUrl: '', // Discord webhook URL for notifications
  slackWebhookUrl: '', // Slack webhook URL for notifications
  emailNotifications: false, // Email notifications
  emailRecipients: '', // Email recipients (comma-separated)
};

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Initialize settings from localStorage or use defaults
    const storedSettings = localStorage.getItem('powerpulse_settings');
    return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('powerpulse_settings', JSON.stringify(settings));
  }, [settings]);

  // Update a single setting
  const updateSetting = (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // Get poll interval in milliseconds (for use with setInterval)
  const getPollIntervalMs = () => {
    return settings.pollInterval * 1000;
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    getPollIntervalMs
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
