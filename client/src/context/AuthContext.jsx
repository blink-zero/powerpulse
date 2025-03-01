import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import useInactivityTimer from '../hooks/useInactivityTimer';
import { authAPI } from '../services/api';
import userSettingsService from '../services/userSettingsService';
import axios from 'axios'; // Still needed for setting default headers

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactivityTimeout, setInactivityTimeout] = useState(() => {
    // Initialize from localStorage or use default
    const storedTimeout = localStorage.getItem('inactivityTimeout');
    return storedTimeout ? parseInt(storedTimeout, 10) : 30; // Default 30 minutes
  });

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);
  
  // Load user settings from server when authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading all settings from server');
      userSettingsService.getUserSettings()
        .then(serverSettings => {
          console.log('Loaded all user settings from server:', serverSettings);
          
          // Set inactivity timeout
          if (serverSettings.inactivity_timeout) {
            setInactivityTimeout(serverSettings.inactivity_timeout);
            localStorage.setItem('inactivityTimeout', serverSettings.inactivity_timeout.toString());
            console.log('Loaded inactivity timeout from server:', serverSettings.inactivity_timeout);
          }
          
          // Convert server settings format to client format for notification settings
          const clientSettings = {
            notifications: serverSettings.notifications_enabled === 1,
            batteryNotifications: serverSettings.battery_notifications === 1,
            lowBatteryNotifications: serverSettings.low_battery_notifications === 1,
            discordWebhookUrl: serverSettings.discord_webhook_url || '',
            slackWebhookUrl: serverSettings.slack_webhook_url || '',
            emailNotifications: serverSettings.email_notifications === 1,
            emailRecipients: serverSettings.email_recipients || '',
            pollInterval: serverSettings.poll_interval || 30
          };
          
          // Save to localStorage
          localStorage.setItem('powerpulse_settings', JSON.stringify(clientSettings));
          console.log('Saved notification settings to localStorage');
        })
        .catch(error => {
          console.error('Error loading user settings from server:', error);
        });
    }
  }, [user]);
  
  // Set up inactivity timer
  const resetInactivityTimer = useInactivityTimer({
    timeout: inactivityTimeout,
    onTimeout: logout,
    isActive: !!user
  });
  
  // Update inactivity timeout
  const updateInactivityTimeout = useCallback((minutes) => {
    setInactivityTimeout(minutes);
    // Persist to localStorage
    localStorage.setItem('inactivityTimeout', minutes.toString());
    
    // Save to server if authenticated
    if (user) {
      userSettingsService.updateInactivityTimeout(minutes)
        .then(response => {
          console.log('Saved inactivity timeout to server:', response);
        })
        .catch(error => {
          console.error('Error saving inactivity timeout to server:', error);
        });
    }
  }, [user]);

  // Check if this is the first time setup
  const checkFirstTimeSetup = useCallback(async () => {
    try {
      const response = await authAPI.checkSetup();
      return response.data.isFirstTimeSetup;
    } catch (error) {
      console.error('Error checking setup status:', error);
      return false;
    }
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setError(null);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Force reload of settings from server after login
      console.log('User logged in, forcing reload of settings from server');
      
      // Load user settings from server
      try {
        const userSettings = await userSettingsService.getUserSettings();
        console.log('Loaded user settings after login:', userSettings);
        
        // Set inactivity timeout
        if (userSettings.inactivity_timeout) {
          setInactivityTimeout(userSettings.inactivity_timeout);
          localStorage.setItem('inactivityTimeout', userSettings.inactivity_timeout.toString());
          console.log('Loaded inactivity timeout after login:', userSettings.inactivity_timeout);
        }
        
        // Convert server settings format to client format for notification settings
        const clientSettings = {
          notifications: userSettings.notifications_enabled === 1,
          batteryNotifications: userSettings.battery_notifications === 1,
          lowBatteryNotifications: userSettings.low_battery_notifications === 1,
          discordWebhookUrl: userSettings.discord_webhook_url || '',
          slackWebhookUrl: userSettings.slack_webhook_url || '',
          emailNotifications: userSettings.email_notifications === 1,
          emailRecipients: userSettings.email_recipients || '',
          pollInterval: userSettings.poll_interval || 30
        };
        
        // Save to localStorage
        localStorage.setItem('powerpulse_settings', JSON.stringify(clientSettings));
        console.log('Saved notification settings to localStorage after login');
      } catch (settingsError) {
        console.error('Error loading user settings after login:', settingsError);
      }
      
      setUser(user);
      setError(null);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Setup first admin user
  const setupAdmin = async (adminData) => {
    try {
      setLoading(true);
      const response = await authAPI.setup(adminData);
      const { user, token } = response.data;
      
      // Save auth data to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Set the Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Force reload of settings from server after setup
      console.log('Admin setup complete, initializing settings');
      
      // Initialize user settings on the server
      try {
        const defaultSettings = {
          inactivity_timeout: 30,
          discord_webhook_url: '',
          slack_webhook_url: '',
          notifications_enabled: 1,
          battery_notifications: 1,
          low_battery_notifications: 1,
          email_notifications: 0,
          email_recipients: '',
          poll_interval: 30
        };
        
        // Save default settings to server
        await userSettingsService.updateUserSettings(defaultSettings);
        
        // Save to localStorage
        const clientSettings = {
          notifications: true,
          batteryNotifications: true,
          lowBatteryNotifications: true,
          discordWebhookUrl: '',
          slackWebhookUrl: '',
          emailNotifications: false,
          emailRecipients: '',
          pollInterval: 30
        };
        
        localStorage.setItem('powerpulse_settings', JSON.stringify(clientSettings));
        localStorage.setItem('inactivityTimeout', '30');
        
        console.log('Initialized user settings after setup');
      } catch (settingsError) {
        console.error('Error initializing user settings after setup:', settingsError);
      }
      
      // Update state
      setUser(user);
      setError(null);
      
      console.log('Setup successful:', { user, token });
      return user;
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.response?.data?.message || 'Setup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword(passwordData);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    setupAdmin,
    checkFirstTimeSetup,
    changePassword,
    inactivityTimeout,
    updateInactivityTimeout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
