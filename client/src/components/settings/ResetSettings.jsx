import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';

const ResetSettings = ({ setPollInterval, setSuccess }) => {
  const { resetSettings, saveAllSettings } = useSettings();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSettings = async () => {
    setIsResetting(true);
    try {
      // Reset local settings
      resetSettings();
      setPollInterval(30); // Default value
      
      // Save reset settings to server
      await saveAllSettings();
      
      setSuccess('Settings reset to defaults and saved to server');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving reset settings to server:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="pt-4 border-t dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Reset Settings</h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Reset all application settings to their default values
      </p>
      <div className="mt-2">
        <button
          onClick={handleResetSettings}
          disabled={isResetting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className="mr-2 -ml-1 h-4 w-4" />
          {isResetting ? 'Resetting...' : 'Reset to Defaults'}
        </button>
      </div>
    </div>
  );
};

export default ResetSettings;
