import React, { useState } from 'react';
import { FiSettings, FiAlertCircle, FiCheck, FiBell, FiUser, FiUsers, FiSliders, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import NotificationSettings from '../components/notifications/NotificationSettings';
import PollingSettings from '../components/settings/PollingSettings';
import AccountSettings from '../components/settings/AccountSettings';
import UserManagement from '../components/settings/UserManagement';
import ResetSettings from '../components/settings/ResetSettings';
import ApplicationInfo from '../components/settings/ApplicationInfo';

/**
 * Settings Page Component
 * 
 * This component has been refactored to use a tab-based interface to reduce visual clutter
 * and improve user experience. Each category of settings is now in its own tab.
 */
const SettingsPage = () => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pollInterval, setPollInterval] = useState(settings.pollInterval);
  const { user } = useAuth();

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

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiSliders className="mr-2 h-4 w-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`${
              activeTab === 'about'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiInfo className="mr-2 h-4 w-4" />
            About
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`${
              activeTab === 'notifications'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiBell className="mr-2 h-4 w-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`${
              activeTab === 'account'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiUser className="mr-2 h-4 w-4" />
            Account
          </button>
          {user && user.isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FiUsers className="mr-2 h-4 w-4" />
              User Management
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {activeTab === 'general' && (
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">General Settings</h3>
            <PollingSettings 
              pollInterval={pollInterval} 
              setPollInterval={setPollInterval} 
              setSuccess={setSuccess} 
            />
            <ResetSettings 
              setPollInterval={setPollInterval} 
              setSuccess={setSuccess} 
            />
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Application Information</h3>
            <ApplicationInfo />
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Notification Settings</h3>
            <NotificationSettings 
              setError={setError} 
              setSuccess={setSuccess} 
            />
          </div>
        )}
        
        {activeTab === 'account' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Account Settings</h3>
            <AccountSettings 
              setError={setError} 
              setSuccess={setSuccess} 
            />
          </div>
        )}
        
        {activeTab === 'users' && user && user.isAdmin && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">User Management</h3>
            <UserManagement 
              setError={setError} 
              setSuccess={setSuccess} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
