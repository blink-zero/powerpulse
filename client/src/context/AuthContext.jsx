import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactivityTimeout, setInactivityTimeout] = useState(30); // Default 30 minutes
  const inactivityTimerRef = useRef(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Initialize inactivity timer
      resetInactivityTimer();
    }
    
    setLoading(false);
  }, []);
  
  // Set up activity listeners
  useEffect(() => {
    if (user) {
      // Events that indicate user activity
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      // Event handler to reset the inactivity timer
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Clean up event listeners
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        // Clear any existing timer
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user, inactivityTimeout]);
  
  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set a new timer
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        // Log the user out after the inactivity period
        logout();
        console.log('User automatically logged out due to inactivity');
      }, inactivityTimeout * 60 * 1000); // Convert minutes to milliseconds
    }
  };
  
  // Update inactivity timeout
  const updateInactivityTimeout = (minutes) => {
    setInactivityTimeout(minutes);
    resetInactivityTimer();
  };

  // Check if this is the first time setup
  const checkFirstTimeSetup = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/check-setup');
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
      const response = await axios.post('/api/auth/register', userData);
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
      const response = await axios.post('/api/auth/login', credentials);
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
      const response = await axios.post('/api/auth/setup', adminData);
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

  // Logout user
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/change-password', passwordData);
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
