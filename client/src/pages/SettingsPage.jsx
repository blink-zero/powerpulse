import React, { useState } from 'react';
import { FiSettings, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import NotificationSettings from '../components/settings/NotificationSettings';
import PollingSettings from '../components/settings/PollingSettings';
import AccountSettings from '../components/settings/AccountSettings';
import UserManagement from '../components/settings/UserManagement';
import ResetSettings from '../components/settings/ResetSettings';

const SettingsPage = () => {
  const { settings } = useSettings();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pollInterval, setPollInterval] = useState(settings.pollInterval);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Application Settings</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Polling Settings */}
            <PollingSettings 
              pollInterval={pollInterval} 
              setPollInterval={setPollInterval} 
              setSuccess={setSuccess} 
            />

            {/* Notification Settings */}
            <NotificationSettings 
              setError={setError} 
              setSuccess={setSuccess} 
            />

            {/* Reset Settings */}
            <ResetSettings 
              setPollInterval={setPollInterval} 
              setSuccess={setSuccess} 
            />
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Account Settings</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <AccountSettings 
            setError={setError} 
            setSuccess={setSuccess} 
          />
        </div>
      </div>

      {/* User Management (Admin only) */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">User Management</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <UserManagement 
            setError={setError} 
            setSuccess={setSuccess} 
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
