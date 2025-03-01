import axios from 'axios';

/**
 * Service for managing notification settings
 */
const notificationSettingsService = {
  /**
   * Get notification settings from the server
   * @returns {Promise<Object>} Notification settings
   */
  getNotificationSettings: async () => {
    try {
      console.log('Fetching notification settings from server');
      const response = await axios.get('/api/notifications/settings');
      console.log('Received notification settings from server:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  /**
   * Update notification settings on the server
   * @param {Object} settings - Notification settings to update
   * @returns {Promise<Object>} Updated notification settings
   */
  updateNotificationSettings: async (settings) => {
    try {
      console.log('updateNotificationSettings called with:', settings);
      
      const serverSettings = {
        discord_webhook_url: settings.discordWebhookUrl,
        slack_webhook_url: settings.slackWebhookUrl,
        notifications_enabled: settings.notifications,
        battery_notifications: settings.batteryNotifications,
        low_battery_notifications: settings.lowBatteryNotifications,
        email_notifications: settings.emailNotifications,
        email_recipients: settings.emailRecipients,
        poll_interval: settings.pollInterval
      };
      
      console.log('Converted to server settings format:', serverSettings);
      console.log('Sending settings to server...');
      
      const response = await axios.post('/api/notifications/settings', serverSettings);
      console.log('Server response:', response.data);
      
      // Verify the settings were saved correctly
      console.log('Verifying settings were saved correctly...');
      const verifyResponse = await axios.get('/api/notifications/settings');
      console.log('Verification response:', verifyResponse.data);
      
      // Check if the settings match what we sent
      const savedSettings = verifyResponse.data;
      console.log('Comparing saved settings with sent settings:');
      console.log('- discord_webhook_url:', savedSettings.discord_webhook_url === serverSettings.discord_webhook_url ? 'match' : 'mismatch');
      console.log('- slack_webhook_url:', savedSettings.slack_webhook_url === serverSettings.slack_webhook_url ? 'match' : 'mismatch');
      console.log('- poll_interval:', savedSettings.poll_interval === serverSettings.poll_interval ? 'match' : 'mismatch');
      
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  /**
   * Send a test Discord notification
   * @param {string} webhookUrl - Discord webhook URL
   * @returns {Promise<Object>} Response from the server
   */
  sendTestDiscordNotification: async (webhookUrl) => {
    try {
      const response = await axios.post('/api/notifications/test', { discord_webhook_url: webhookUrl });
      return response.data;
    } catch (error) {
      console.error('Error sending test Discord notification:', error);
      throw error;
    }
  },

  /**
   * Send a test Slack notification
   * @param {string} webhookUrl - Slack webhook URL
   * @returns {Promise<Object>} Response from the server
   */
  sendTestSlackNotification: async (webhookUrl) => {
    try {
      const response = await axios.post('/api/notifications/test-slack', { slack_webhook_url: webhookUrl });
      return response.data;
    } catch (error) {
      console.error('Error sending test Slack notification:', error);
      throw error;
    }
  },

  /**
   * Send a test email notification
   * @param {string} recipients - Email recipients (comma-separated)
   * @returns {Promise<Object>} Response from the server
   */
  sendTestEmailNotification: async (recipients) => {
    try {
      const response = await axios.post('/api/notifications/test-email', { email_recipients: recipients });
      return response.data;
    } catch (error) {
      console.error('Error sending test email notification:', error);
      throw error;
    }
  }
};

export default notificationSettingsService;
