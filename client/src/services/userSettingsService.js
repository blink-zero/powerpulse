import axios from 'axios';

/**
 * Service for managing user settings
 */
const userSettingsService = {
  /**
   * Get user settings from the server
   * @returns {Promise<Object>} User settings
   */
  getUserSettings: async () => {
    try {
      console.log('Fetching user settings from server');
      const response = await axios.get('/api/user-settings');
      console.log('Received user settings from server:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  /**
   * Update user settings on the server
   * @param {Object} settings - User settings to update
   * @returns {Promise<Object>} Updated user settings
   */
  updateUserSettings: async (settings) => {
    try {
      console.log('Updating user settings on server:', settings);
      const response = await axios.post('/api/user-settings', settings);
      console.log('Server response for user settings update:', response.data);
      
      // Verify the settings were saved correctly
      console.log('Verifying user settings were saved correctly...');
      const verifyResponse = await axios.get('/api/user-settings');
      console.log('Verification response:', verifyResponse.data);
      
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  /**
   * Update inactivity timeout on the server
   * @param {number} timeout - Inactivity timeout in minutes
   * @returns {Promise<Object>} Updated user settings
   */
  updateInactivityTimeout: async (timeout) => {
    try {
      console.log(`Updating inactivity timeout to ${timeout} minutes`);
      const response = await axios.post('/api/user-settings', { inactivity_timeout: timeout });
      console.log('Server response for inactivity timeout update:', response.data);
      
      // Verify the settings were saved correctly
      console.log('Verifying inactivity timeout was saved correctly...');
      const verifyResponse = await axios.get('/api/user-settings');
      console.log('Verification response:', verifyResponse.data);
      console.log(`Saved inactivity timeout: ${verifyResponse.data.inactivity_timeout}`);
      
      return response.data;
    } catch (error) {
      console.error('Error updating inactivity timeout:', error);
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
      console.log('Updating notification settings on server:', settings);
      
      // Convert client settings format to server format
      const serverSettings = {
        discord_webhook_url: settings.discordWebhookUrl,
        slack_webhook_url: settings.slackWebhookUrl,
        notifications_enabled: settings.notifications === false ? 0 : 1,
        battery_notifications: settings.batteryNotifications === false ? 0 : 1,
        low_battery_notifications: settings.lowBatteryNotifications === false ? 0 : 1,
        email_notifications: settings.emailNotifications === true ? 1 : 0,
        email_recipients: settings.emailRecipients || '',
        poll_interval: settings.pollInterval || 30
      };
      
      console.log('Converted to server settings format:', serverSettings);
      
      // Send the update request
      const response = await axios.post('/api/user-settings', serverSettings);
      console.log('Server response for notification settings update:', response.data);
      
      // Verify the settings were saved correctly
      console.log('Verifying notification settings were saved correctly...');
      const verifyResponse = await axios.get('/api/user-settings');
      console.log('Verification response:', verifyResponse.data);
      
      // Check if poll_interval was saved correctly
      if (serverSettings.poll_interval !== verifyResponse.data.poll_interval) {
        console.error(`Poll interval not saved correctly. Expected ${serverSettings.poll_interval}, got ${verifyResponse.data.poll_interval}`);
        throw new Error(`Failed to save poll interval. Expected ${serverSettings.poll_interval}, got ${verifyResponse.data.poll_interval}`);
      }
      
      return verifyResponse.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  /**
   * Get notification settings from the server
   * @returns {Promise<Object>} Notification settings in client format
   */
  getNotificationSettings: async () => {
    try {
      console.log('Fetching notification settings from server');
      const response = await axios.get('/api/user-settings');
      console.log('Received user settings from server:', response.data);
      
      // Convert server settings to client format
      const clientSettings = {
        notifications: response.data.notifications_enabled === 1,
        batteryNotifications: response.data.battery_notifications === 1,
        lowBatteryNotifications: response.data.low_battery_notifications === 1,
        discordWebhookUrl: response.data.discord_webhook_url || '',
        slackWebhookUrl: response.data.slack_webhook_url || '',
        emailNotifications: response.data.email_notifications === 1,
        emailRecipients: response.data.email_recipients || '',
        pollInterval: response.data.poll_interval || 30
      };
      
      console.log('Converted to client settings format:', clientSettings);
      
      return clientSettings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
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

export default userSettingsService;
