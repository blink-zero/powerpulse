import React, { useState } from 'react';
import { FiMail } from 'react-icons/fi';
import userSettingsService from '../../services/userSettingsService';

/**
 * Email Notification Settings Component
 * 
 * This component handles email notification configuration and testing.
 * It's been extracted from the larger NotificationSettings component
 * to improve code organization and maintainability.
 */
const EmailNotificationSettings = ({ 
  settings, 
  updateSetting, 
  notificationsEnabled, 
  setError, 
  setSuccess 
}) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestEmailNotification = async () => {
    if (!settings.emailRecipients) {
      setError('Please enter email recipients');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setIsTesting(true);
    try {
      await userSettingsService.sendTestEmailNotification(settings.emailRecipients);
      
      setSuccess('Test notification sent to email recipients');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="border-t pt-4 dark:border-gray-700">
      <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
        <FiMail className="mr-2 h-4 w-4" />
        Email Notifications
      </h5>
      
      <div className="flex items-start mt-2">
        <div className="flex items-center h-5">
          <input
            id="emailNotifications"
            name="emailNotifications"
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={async (e) => {
              console.log(`Updating Email notifications to: ${e.target.checked}`);
              await updateSetting('emailNotifications', e.target.checked);
              
              // Save the setting to the server immediately
              console.log('Email notifications checkbox changed, saving to server');
              try {
                await userSettingsService.updateNotificationSettings({
                  ...settings,
                  emailNotifications: e.target.checked
                });
                console.log('Saved email notifications setting to server');
              } catch (error) {
                console.error('Error saving email notifications setting to server:', error);
              }
            }}
            disabled={!notificationsEnabled}
            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
          />
        </div>
        <div className="ml-3 text-sm">
          <label 
            htmlFor="emailNotifications" 
            className={`font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled ? 'opacity-50' : ''}`}
          >
            Enable email notifications
          </label>
          <p className={`text-gray-500 dark:text-gray-400 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
            Receive email notifications for UPS status changes
          </p>
        </div>
      </div>
      
      <div className="mb-4 mt-2">
        <label 
          htmlFor="emailRecipients" 
          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled || !settings.emailNotifications ? 'opacity-50' : ''}`}
        >
          Email Recipients
        </label>
        <input
          type="text"
          id="emailRecipients"
          name="emailRecipients"
          value={settings.emailRecipients || ''}
          onChange={(e) => {
            console.log(`Updating Email recipients to: ${e.target.value}`);
            updateSetting('emailRecipients', e.target.value);
          }}
          onBlur={async () => {
            // Save the setting to the server when the input loses focus
            console.log('Email recipients input lost focus, saving to server');
            try {
              await userSettingsService.updateNotificationSettings({
                ...settings,
                emailRecipients: settings.emailRecipients
              });
              console.log('Saved email recipients to server');
            } catch (error) {
              console.error('Error saving email recipients to server:', error);
            }
          }}
          disabled={!notificationsEnabled || !settings.emailNotifications}
          placeholder="email1@example.com, email2@example.com"
          className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!notificationsEnabled || !settings.emailNotifications ? 'opacity-50' : ''}`}
        />
        <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!notificationsEnabled || !settings.emailNotifications ? 'opacity-50' : ''}`}>
          Enter comma-separated email addresses to receive notifications
        </p>
      </div>
      
      <div className="mt-2">
        <button
          onClick={handleTestEmailNotification}
          disabled={!notificationsEnabled || !settings.emailNotifications || !settings.emailRecipients || isTesting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiMail className="mr-2 -ml-1 h-4 w-4" />
          {isTesting ? 'Sending...' : 'Test Email Notification'}
        </button>
      </div>
    </div>
  );
};

export default EmailNotificationSettings;
