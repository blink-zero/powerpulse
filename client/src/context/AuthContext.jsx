import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useInactivityTimer from '../hooks/useInactivityTimer';
import { authAPI, userSettingsAPI } from '../services/api';
import axios from 'axios'; // Still needed for setting default headers

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactivityTimeout, setInactivityTimeout] = useState(30); // Default 30 minutes, will be updated from server

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
      
      // Load user settings from server
      userSettingsAPI.getSettings()
        .then(response => {
          if (response.data && response.data.inactivity_timeout) {
            setInactivityTimeout(response.data.inactivity_timeout);
          }
        })
        .catch(error => {
          console.error('Error loading user settings:', error);
        });
    }
    
    setLoading(false);
  }, []);
  
  // Set up inactivity timer
  const resetInactivityTimer = useInactivityTimer({
    timeout: inactivityTimeout,
    onTimeout: logout,
    isActive: !!user
  });
  
  // Update inactivity timeout
  const updateInactivityTimeout = useCallback((minutes) => {
    setInactivityTimeout(minutes);
    
    // Save to server
    userSettingsAPI.updateSettings({ inactivity_timeout: minutes })
      .then(response => {
        console.log('Inactivity timeout saved to server:', response.data);
      })
      .catch(error => {
        console.error('Error saving inactivity timeout to server:', error);
      });
  }, []);

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
