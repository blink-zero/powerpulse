import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(() => {
    // Initialize settings from localStorage or use defaults
    const storedSettings = localStorage.getItem('powerpulse_settings');
    return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  });
  const [loading, setLoading] = useState(true);

  // Load settings from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      axios.get('/api/notifications/settings')
        .then(response => {
          // Convert server settings format to client format
          const serverSettings = response.data;
          const clientSettings = {
            ...settings,
            notifications: serverSettings.notifications_enabled === 1,
            batteryNotifications: serverSettings.battery_notifications === 1,
            lowBatteryNotifications: serverSettings.low_battery_notifications === 1,
            discordWebhookUrl: serverSettings.discord_webhook_url || '',
            slackWebhookUrl: serverSettings.slack_webhook_url || '',
            emailNotifications: serverSettings.email_notifications === 1,
            emailRecipients: serverSettings.email_recipients || ''
          };
          setSettings(clientSettings);
          console.log('Loaded notification settings from server:', clientSettings);
        })
        .catch(error => {
          console.error('Error loading settings from server:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('powerpulse_settings', JSON.stringify(settings));
  }, [settings]);

  // Save notification settings to server when they change
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Convert client settings format to server format
      const serverSettings = {
        discord_webhook_url: settings.discordWebhookUrl,
        slack_webhook_url: settings.slackWebhookUrl,
        notifications_enabled: settings.notifications,
        battery_notifications: settings.batteryNotifications,
        low_battery_notifications: settings.lowBatteryNotifications,
        email_notifications: settings.emailNotifications,
        email_recipients: settings.emailRecipients
      };

      axios.post('/api/notifications/settings', serverSettings)
        .then(response => {
          console.log('Saved notification settings to server:', response.data);
        })
        .catch(error => {
          console.error('Error saving settings to server:', error);
        });
    }
  }, [
    isAuthenticated,
    loading,
    settings.notifications,
    settings.batteryNotifications,
    settings.lowBatteryNotifications,
    settings.discordWebhookUrl,
    settings.slackWebhookUrl,
    settings.emailNotifications,
    settings.emailRecipients
  ]);

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
