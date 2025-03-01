import React, { useState } from 'react';
import { FiSave, FiClock } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';

const PollingSettings = ({ pollInterval, setPollInterval, setSuccess }) => {
  const { settings, updateSetting, saveUserSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const savePollInterval = async () => {
    setIsSaving(true);
    try {
      // Update local setting
      updateSetting('pollInterval', pollInterval);
      
      // Save to server
      await saveUserSettings();
      
      setSuccess('Poll interval updated successfully and saved to server');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving poll interval to server:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dashboard Polling Interval</h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Set how frequently the dashboard should update UPS data (in seconds)
      </p>
      <div className="mt-2 flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={pollInterval}
            onChange={(e) => setPollInterval(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>5s</span>
            <span>30s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{pollInterval}s</span>
          <button
            onClick={savePollInterval}
            disabled={isSaving}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="mr-2 -ml-1 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Current setting: Dashboard updates every {settings.pollInterval} seconds
      </p>
    </div>
  );
};

export default PollingSettings;
