import React, { useState } from 'react';
import axios from 'axios';
import { FiSlack } from 'react-icons/fi';

/**
 * Slack Notification Settings Component
 * 
 * This component handles Slack webhook configuration and testing.
 * It's been extracted from the larger NotificationSettings component
 * to improve code organization and maintainability.
 */
const SlackNotificationSettings = ({ 
  settings, 
  updateSetting, 
  notificationsEnabled, 
  setError, 
  setSuccess 
}) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestSlackWebhook = async () => {
    if (!settings.slackWebhookUrl) {
      setError('Please enter a Slack webhook URL');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setIsTesting(true);
    try {
      await axios.post('/api/notifications/test-slack', {
        slack_webhook_url: settings.slackWebhookUrl
      });
      
      setSuccess('Test notification sent to Slack');
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
        <FiSlack className="mr-2 h-4 w-4" />
        Slack Notifications
      </h5>
      
      <div className="mb-4 mt-2">
        <label 
          htmlFor="slackWebhookUrl" 
          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled ? 'opacity-50' : ''}`}
        >
          Slack Webhook URL
        </label>
        <input
          type="text"
          id="slackWebhookUrl"
          name="slackWebhookUrl"
          value={settings.slackWebhookUrl || ''}
          onChange={(e) => updateSetting('slackWebhookUrl', e.target.value)}
          disabled={!notificationsEnabled}
          placeholder="https://hooks.slack.com/services/..."
          className={`mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!notificationsEnabled ? 'opacity-50' : ''}`}
        />
        <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
          Create a webhook in your Slack workspace and paste the URL here
        </p>
      </div>
      
      <div className="mt-2">
        <button
          onClick={handleTestSlackWebhook}
          disabled={!notificationsEnabled || !settings.slackWebhookUrl || isTesting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSlack className="mr-2 -ml-1 h-4 w-4" />
          {isTesting ? 'Sending...' : 'Test Slack Webhook'}
        </button>
      </div>
    </div>
  );
};

export default SlackNotificationSettings;
