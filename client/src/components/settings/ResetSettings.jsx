import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';

const ResetSettings = ({ setPollInterval, setSuccess }) => {
  const { resetSettings } = useSettings();

  const handleResetSettings = () => {
    resetSettings();
    setPollInterval(30); // Default value
    setSuccess('Settings reset to defaults');
    setTimeout(() => setSuccess(null), 3000);
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
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiRefreshCw className="mr-2 -ml-1 h-4 w-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ResetSettings;
