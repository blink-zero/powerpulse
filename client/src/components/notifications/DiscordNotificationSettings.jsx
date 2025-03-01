import React, { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import userSettingsService from '../../services/userSettingsService';

/**
 * Discord Notification Settings Component
 * 
 * This component handles Discord webhook configuration and testing.
 * It's been extracted from the larger NotificationSettings component
 * to improve code organization and maintainability.
 */
const DiscordNotificationSettings = ({ 
  settings, 
  updateSetting, 
  notificationsEnabled, 
  setError, 
  setSuccess 
}) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestDiscordWebhook = async () => {
    if (!settings.discordWebhookUrl) {
      setError('Please enter a Discord webhook URL');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setIsTesting(true);
    try {
      await userSettingsService.sendTestDiscordNotification(settings.discordWebhookUrl);
      
      setSuccess('Test notification sent to Discord');
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
        <FiBell className="mr-2 h-4 w-4" />
        Discord Notifications
      </h5>
      
      <div className="mb-4 mt-2">
        <label 
          htmlFor="discordWebhookUrl" 
          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled ? 'opacity-50' : ''}`}
        >
          Discord Webhook URL
        </label>
        <input
          type="text"
          id="discordWebhookUrl"
          name="discordWebhookUrl"
          value={settings.discordWebhookUrl || ''}
          onChange={(e) => {
            console.log(`Updating Discord webhook URL to: ${e.target.value}`);
            updateSetting('discordWebhookUrl', e.target.value);
          }}
          onBlur={async () => {
            // Save the setting to the server when the input loses focus
            console.log('Discord webhook URL input lost focus, saving to server');
            try {
              await userSettingsService.updateNotificationSettings({
                ...settings,
                discordWebhookUrl: settings.discordWebhookUrl
              });
              console.log('Saved Discord webhook URL to server');
            } catch (error) {
              console.error('Error saving Discord webhook URL to server:', error);
            }
          }}
          disabled={!notificationsEnabled}
          placeholder="https://discord.com/api/webhooks/..."
          className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!notificationsEnabled ? 'opacity-50' : ''}`}
        />
        <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
          Create a webhook in your Discord server and paste the URL here
        </p>
      </div>
      
      <div className="mt-2">
        <button
          onClick={handleTestDiscordWebhook}
          disabled={!notificationsEnabled || !settings.discordWebhookUrl || isTesting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiBell className="mr-2 -ml-1 h-4 w-4" />
          {isTesting ? 'Sending...' : 'Test Discord Webhook'}
        </button>
      </div>
    </div>
  );
};

export default DiscordNotificationSettings;
