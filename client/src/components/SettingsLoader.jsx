import React, { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

/**
 * SettingsLoader Component
 * 
 * This component is responsible for loading settings from the server
 * when the app starts or when the user logs in. It should be mounted
 * at the top level of the app.
 */
const SettingsLoader = () => {
  const { loadSettingsFromServer } = useSettings();
  const { user } = useAuth();

  // Load settings from server when the component mounts or when the user changes
  useEffect(() => {
    if (user) {
      console.log('SettingsLoader: Loading settings from server...');
      loadSettingsFromServer()
        .then(settings => {
          if (settings) {
            console.log('SettingsLoader: Current settings in context:', settings);
          }
        })
        .catch(error => {
          console.error('SettingsLoader: Error loading settings:', error);
        });
    }
  }, [user, loadSettingsFromServer]);

  // This component doesn't render anything
  return null;
};

export default SettingsLoader;
