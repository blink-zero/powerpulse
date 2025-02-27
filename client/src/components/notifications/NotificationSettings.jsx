import React, { useState } from 'react';
import axios from 'axios';
import { FiBell, FiSave } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';
import DiscordNotificationSettings from './DiscordNotificationSettings';
import SlackNotificationSettings from './SlackNotificationSettings';
import EmailNotificationSettings from './EmailNotificationSettings';
import NotificationTypes from './NotificationTypes';
import NotificationHistory from './NotificationHistory';

/**
 * Main Notification Settings Component
 * 
 * This component serves as the container for all notification-related settings.
 * It has been refactored to use smaller, more focused components for better
 * code organization and maintainability.
 */
const NotificationSettings = ({ setError, setSuccess }) => {
  const { settings, updateSetting } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Function to save notification settings to the server
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Convert client settings format to server format
      const serverSettings = {
        discord_webhook_url: settings.discordWebhookUrl,
        slack_webhook_url: settings.slackWebhookUrl,
        notifications_enabled: settings.notifications,
        battery_notifications: settings.batteryNotifications,
        low_battery_notifications: settings.lowBatteryNotifications,
        email_notifications: settings.emailNotifications,
        email_recipients: settings.emailRecipients
      };

      // Send settings to server
      const response = await axios.post('/api/notifications/settings', serverSettings);
      
      setSuccess('Notification settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      console.log('Saved notification settings to server:', response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notification settings');
      setTimeout(() => setError(null), 5000);
      console.error('Error saving settings to server:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-4 border-t dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Configure notifications for UPS status changes
      </p>
      <div className="mt-4 space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="notifications"
              name="notifications"
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => updateSetting('notifications', e.target.checked)}
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="notifications" className="font-medium text-gray-700 dark:text-gray-300">
              Enable notifications
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Receive notifications when UPS status changes
            </p>
          </div>
        </div>
        
        {/* Discord Notifications */}
        <DiscordNotificationSettings 
          settings={settings} 
          updateSetting={updateSetting} 
          notificationsEnabled={settings.notifications}
          setError={setError}
          setSuccess={setSuccess}
        />
        
        {/* Slack Notifications */}
        <SlackNotificationSettings 
          settings={settings} 
          updateSetting={updateSetting} 
          notificationsEnabled={settings.notifications}
          setError={setError}
          setSuccess={setSuccess}
        />
        
        {/* Email Notifications */}
        <EmailNotificationSettings 
          settings={settings} 
          updateSetting={updateSetting} 
          notificationsEnabled={settings.notifications}
          setError={setError}
          setSuccess={setSuccess}
        />
        
        {/* Notification Types */}
        <NotificationTypes 
          settings={settings} 
          updateSetting={updateSetting} 
          notificationsEnabled={settings.notifications}
        />
        
        {/* Save Button */}
        <div className="border-t pt-4 mt-4 dark:border-gray-700">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="mr-2 -ml-1 h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </button>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Click to save your notification settings to the server. This is required for notifications to work.
          </p>
        </div>
        
        {/* Notification History */}
        <NotificationHistory />
      </div>
    </div>
  );
};

export default NotificationSettings;
