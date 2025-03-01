import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationsAPI, userSettingsAPI } from '../services/api';

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
      
      // Load notification settings
      const loadNotificationSettings = notificationsAPI.getSettings()
        .then(response => {
          // Convert server settings format to client format
          const serverSettings = response.data;
          return {
            notifications: serverSettings.notifications_enabled === 1,
            batteryNotifications: serverSettings.battery_notifications === 1,
            lowBatteryNotifications: serverSettings.low_battery_notifications === 1,
            discordWebhookUrl: serverSettings.discord_webhook_url || '',
            slackWebhookUrl: serverSettings.slack_webhook_url || '',
            emailNotifications: serverSettings.email_notifications === 1,
            emailRecipients: serverSettings.email_recipients || ''
          };
        })
        .catch(error => {
          console.error('Error loading notification settings from server:', error);
          return {};
        });
      
      // Load user settings
      const loadUserSettings = userSettingsAPI.getSettings()
        .then(response => {
          const userSettings = response.data;
          return {
            pollInterval: userSettings.poll_interval || 30,
            darkMode: userSettings.dark_mode === 1
          };
        })
        .catch(error => {
          console.error('Error loading user settings from server:', error);
          return {};
        });
      
      // Wait for both settings to load
      Promise.all([loadNotificationSettings, loadUserSettings])
        .then(([notificationSettings, userSettings]) => {
          // Create new settings object prioritizing server settings
          const clientSettings = {
            ...defaultSettings, // Start with defaults
            ...userSettings, // Apply user settings from server
            ...notificationSettings // Apply notification settings from server
          };
          
          // Update settings state with server values
          setSettings(clientSettings);
          
          // Also update localStorage with these server-synced settings
          localStorage.setItem('powerpulse_settings', JSON.stringify(clientSettings));
          
          console.log('Loaded settings from server:', clientSettings);
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

  // Update a single setting (only updates local state, not server)
  const updateSetting = (key, value) => {
    setSettings(prevSettings => {
      const newSettings = {
        ...prevSettings,
        [key]: value
      };
      
      // Update localStorage
      localStorage.setItem('powerpulse_settings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };
  
  // Save notification settings to server
  const saveNotificationSettings = async () => {
    if (!isAuthenticated) return;
    
    try {
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

      const response = await notificationsAPI.updateSettings(serverSettings);
      console.log('Saved notification settings to server:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving notification settings to server:', error);
      throw error;
    }
  };
  
  // Save user settings to server
  const saveUserSettings = async () => {
    if (!isAuthenticated) return;
    
    try {
      const userSettings = {
        poll_interval: settings.pollInterval,
        dark_mode: settings.darkMode ? 1 : 0
      };
      
      const response = await userSettingsAPI.updateSettings(userSettings);
      console.log('Saved user settings to server:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving user settings to server:', error);
      throw error;
    }
  };
  
  // Save all settings to server
  const saveAllSettings = async () => {
    if (!isAuthenticated) return;
    
    try {
      const [notificationResult, userResult] = await Promise.all([
        saveNotificationSettings(),
        saveUserSettings()
      ]);
      
      return {
        notification: notificationResult,
        user: userResult
      };
    } catch (error) {
      console.error('Error saving all settings to server:', error);
      throw error;
    }
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
    getPollIntervalMs,
    saveNotificationSettings,
    saveUserSettings,
    saveAllSettings,
    loading
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
