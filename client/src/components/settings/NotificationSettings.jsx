import React, { useState } from 'react';
import axios from 'axios';
import { FiBell, FiMail, FiSlack, FiSave } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';

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

  const handleTestDiscordWebhook = async () => {
    if (!settings.discordWebhookUrl) {
      setError('Please enter a Discord webhook URL');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    try {
      await axios.post('/api/notifications/test', {
        discord_webhook_url: settings.discordWebhookUrl
      });
      
      setSuccess('Test notification sent to Discord');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTestSlackWebhook = async () => {
    if (!settings.slackWebhookUrl) {
      setError('Please enter a Slack webhook URL');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    try {
      await axios.post('/api/notifications/test-slack', {
        slack_webhook_url: settings.slackWebhookUrl
      });
      
      setSuccess('Test notification sent to Slack');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTestEmailNotification = async () => {
    if (!settings.emailRecipients) {
      setError('Please enter email recipients');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    try {
      await axios.post('/api/notifications/test-email', {
        email_recipients: settings.emailRecipients
      });
      
      setSuccess('Test notification sent to email recipients');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
      setTimeout(() => setError(null), 5000);
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
        <div className="border-t pt-4 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
            <FiBell className="mr-2 h-4 w-4" />
            Discord Notifications
          </h5>
          
          <div className="mb-4 mt-2">
            <label htmlFor="discordWebhookUrl" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications ? 'opacity-50' : ''}`}>
              Discord Webhook URL
            </label>
            <input
              type="text"
              id="discordWebhookUrl"
              name="discordWebhookUrl"
              value={settings.discordWebhookUrl || ''}
              onChange={(e) => updateSetting('discordWebhookUrl', e.target.value)}
              disabled={!settings.notifications}
              placeholder="https://discord.com/api/webhooks/..."
              className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!settings.notifications ? 'opacity-50' : ''}`}
            />
            <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!settings.notifications ? 'opacity-50' : ''}`}>
              Create a webhook in your Discord server and paste the URL here
            </p>
          </div>
          
          <div className="mt-2">
            <button
              onClick={handleTestDiscordWebhook}
              disabled={!settings.notifications || !settings.discordWebhookUrl}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiBell className="mr-2 -ml-1 h-4 w-4" />
              Test Discord Webhook
            </button>
          </div>
        </div>
        
        {/* Slack Notifications */}
        <div className="border-t pt-4 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
            <FiSlack className="mr-2 h-4 w-4" />
            Slack Notifications
          </h5>
          
          <div className="mb-4 mt-2">
            <label htmlFor="slackWebhookUrl" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications ? 'opacity-50' : ''}`}>
              Slack Webhook URL
            </label>
            <input
              type="text"
              id="slackWebhookUrl"
              name="slackWebhookUrl"
              value={settings.slackWebhookUrl || ''}
              onChange={(e) => updateSetting('slackWebhookUrl', e.target.value)}
              disabled={!settings.notifications}
              placeholder="https://hooks.slack.com/services/..."
              className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!settings.notifications ? 'opacity-50' : ''}`}
            />
            <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!settings.notifications ? 'opacity-50' : ''}`}>
              Create a webhook in your Slack workspace and paste the URL here
            </p>
          </div>
          
          <div className="mt-2">
            <button
              onClick={handleTestSlackWebhook}
              disabled={!settings.notifications || !settings.slackWebhookUrl}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSlack className="mr-2 -ml-1 h-4 w-4" />
              Test Slack Webhook
            </button>
          </div>
        </div>
        
        {/* Email Notifications */}
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
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                disabled={!settings.notifications}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="emailNotifications" className={`font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Enable email notifications
              </label>
              <p className={`text-gray-500 dark:text-gray-400 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Receive email notifications for UPS status changes
              </p>
            </div>
          </div>
          
          <div className="mb-4 mt-2">
            <label htmlFor="emailRecipients" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications || !settings.emailNotifications ? 'opacity-50' : ''}`}>
              Email Recipients
            </label>
            <input
              type="text"
              id="emailRecipients"
              name="emailRecipients"
              value={settings.emailRecipients || ''}
              onChange={(e) => updateSetting('emailRecipients', e.target.value)}
              disabled={!settings.notifications || !settings.emailNotifications}
              placeholder="email1@example.com, email2@example.com"
              className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!settings.notifications || !settings.emailNotifications ? 'opacity-50' : ''}`}
            />
            <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!settings.notifications || !settings.emailNotifications ? 'opacity-50' : ''}`}>
              Enter comma-separated email addresses to receive notifications
            </p>
          </div>
          
          <div className="mt-2">
            <button
              onClick={handleTestEmailNotification}
              disabled={!settings.notifications || !settings.emailNotifications || !settings.emailRecipients}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMail className="mr-2 -ml-1 h-4 w-4" />
              Test Email Notification
            </button>
          </div>
        </div>
        
        {/* Notification Types */}
        <div className="border-t pt-4 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white">Notification Types</h5>
          
          <div className="flex items-start mt-2">
            <div className="flex items-center h-5">
              <input
                id="batteryNotifications"
                name="batteryNotifications"
                type="checkbox"
                checked={settings.batteryNotifications !== false}
                onChange={(e) => updateSetting('batteryNotifications', e.target.checked)}
                disabled={!settings.notifications}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="batteryNotifications" className={`font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Battery status notifications
              </label>
              <p className={`text-gray-500 dark:text-gray-400 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Get notified when a UPS goes on battery power
              </p>
            </div>
          </div>
          
          <div className="flex items-start mt-2">
            <div className="flex items-center h-5">
              <input
                id="lowBatteryNotifications"
                name="lowBatteryNotifications"
                type="checkbox"
                checked={settings.lowBatteryNotifications !== false}
                onChange={(e) => updateSetting('lowBatteryNotifications', e.target.checked)}
                disabled={!settings.notifications}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="lowBatteryNotifications" className={`font-medium text-gray-700 dark:text-gray-300 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Low battery notifications
              </label>
              <p className={`text-gray-500 dark:text-gray-400 ${!settings.notifications ? 'opacity-50' : ''}`}>
                Get notified when a UPS battery is running low
              </p>
            </div>
          </div>
        </div>
        
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
      </div>
    </div>
  );
};

export default NotificationSettings;
