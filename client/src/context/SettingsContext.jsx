import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import userSettingsService from '../services/userSettingsService';

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
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Function to load settings from the server
  const loadSettingsFromServer = useCallback(() => {
    if (!user) return Promise.resolve();
    
    console.log('Loading settings from server...');
    setLoading(true);
    
    return userSettingsService.getUserSettings()
      .then(serverSettings => {
        // Log the raw server settings
        console.log('Raw server settings:', serverSettings);
        
        // Convert server settings format to client format
        const clientSettings = {
          ...defaultSettings, // Start with default settings
          notifications: serverSettings.notifications_enabled === 1,
          batteryNotifications: serverSettings.battery_notifications === 1,
          lowBatteryNotifications: serverSettings.low_battery_notifications === 1,
          discordWebhookUrl: serverSettings.discord_webhook_url || '',
          slackWebhookUrl: serverSettings.slack_webhook_url || '',
          emailNotifications: serverSettings.email_notifications === 1,
          emailRecipients: serverSettings.email_recipients || '',
          pollInterval: serverSettings.poll_interval || 30 // Load poll interval from server
        };
        
        // Log the loaded settings
        console.log('Loaded settings from server:', {
          notifications: clientSettings.notifications,
          batteryNotifications: clientSettings.batteryNotifications,
          lowBatteryNotifications: clientSettings.lowBatteryNotifications,
          discordWebhookUrl: clientSettings.discordWebhookUrl ? 'configured' : 'not configured',
          slackWebhookUrl: clientSettings.slackWebhookUrl ? 'configured' : 'not configured',
          emailNotifications: clientSettings.emailNotifications,
          emailRecipients: clientSettings.emailRecipients ? 'configured' : 'not configured',
          pollInterval: clientSettings.pollInterval
        });
        
        // Log the actual values for debugging
        console.log('Actual webhook URLs:', {
          discordWebhookUrl: clientSettings.discordWebhookUrl,
          slackWebhookUrl: clientSettings.slackWebhookUrl,
          emailRecipients: clientSettings.emailRecipients,
          pollInterval: clientSettings.pollInterval
        });
        
        setSettings(clientSettings);
        
        // Also update localStorage with server settings
        localStorage.setItem('powerpulse_settings', JSON.stringify(clientSettings));
        console.log('Saved notification settings to localStorage');
        
        return clientSettings;
      })
      .catch(error => {
        console.error('Error loading settings from server:', error);
        return null;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);
  
  // Load settings from server when authenticated, fallback to localStorage if server fails
  useEffect(() => {
    // Start with default settings
    let initialSettings = { ...defaultSettings };
    
    // Try to get settings from localStorage as a fallback
    const storedSettings = localStorage.getItem('powerpulse_settings');
    if (storedSettings) {
      try {
        initialSettings = { ...initialSettings, ...JSON.parse(storedSettings) };
        console.log('Loaded initial settings from localStorage:', initialSettings);
      } catch (e) {
        console.error('Error parsing stored settings:', e);
      }
    }
    
    // Set initial settings
    setSettings(initialSettings);
    
    // If user is logged in, always load settings from server
    if (user) {
      console.log('User is authenticated, loading settings from server');
      loadSettingsFromServer();
    } else {
      setLoading(false);
    }
  }, [user, loadSettingsFromServer]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('powerpulse_settings', JSON.stringify(settings));
  }, [settings]);

  // Save notification settings to server when they change (with debounce)
  const saveTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (user && !loading) {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set a new timeout to save settings after a delay
      saveTimeoutRef.current = setTimeout(() => {
        console.log('Saving settings to server (debounced):', settings);
        userSettingsService.updateNotificationSettings(settings)
          .then(response => {
            console.log('Saved notification settings to server:', response);
          })
          .catch(error => {
            console.error('Error saving settings to server:', error);
          });
      }, 1000); // 1 second debounce
    }
    
    // Cleanup function to clear the timeout when the component unmounts
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    user,
    loading,
    settings.notifications,
    settings.batteryNotifications,
    settings.lowBatteryNotifications,
    settings.discordWebhookUrl,
    settings.slackWebhookUrl,
    settings.emailNotifications,
    settings.emailRecipients,
    settings.pollInterval
  ]);

  // Update a single setting and save it to the server immediately
  const updateSetting = async (key, value) => {
    console.log(`updateSetting called with key=${key}, value=${value}`);
    
    // Create new settings object
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    console.log(`New settings after update:`, newSettings);
    
    // Update local state first
    setSettings(newSettings);
    
    // Force save to localStorage immediately
    localStorage.setItem('powerpulse_settings', JSON.stringify(newSettings));
    console.log('Saved settings to localStorage');
    
    // Save to server if authenticated
    if (user && !loading) {
      console.log(`Immediately saving setting ${key}=${value} to server`);
      console.log('Full settings being saved:', newSettings);
      
      try {
        const response = await userSettingsService.updateNotificationSettings(newSettings);
        console.log(`Successfully saved setting ${key} to server:`, response);
        
        // Force reload settings from server to verify they were saved correctly
        console.log('Reloading settings from server to verify...');
        await loadSettingsFromServer();
      } catch (error) {
        console.error(`Error saving setting ${key} to server:`, error);
        
        // If there was an error saving to the server, reload settings from server
        // to ensure UI is in sync with server state
        loadSettingsFromServer();
      }
    } else {
      console.log(`Not saving to server: user=${!!user}, loading=${loading}`);
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
    loadSettingsFromServer
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
