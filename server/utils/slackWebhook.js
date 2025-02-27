const axios = require('axios');

/**
 * Send a notification to a Slack webhook
 * @param {string} webhookUrl - The Slack webhook URL
 * @param {Object} message - The message to send
 * @param {string} message.title - The title of the message
 * @param {string} message.description - The description of the message
 * @param {string} message.color - The color of the attachment (in hex format)
 * @returns {Promise<Object>} - The response from the Slack API
 */
async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) {
    throw new Error('Slack webhook URL is required');
  }

  // Validate webhook URL format
  if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
    throw new Error('Invalid Slack webhook URL format');
  }

  // Convert hex color to Slack color name if possible
  let slackColor = 'good'; // default green
  if (message.color) {
    if (message.color === '#FF0000' || message.color.toLowerCase() === 'red') {
      slackColor = 'danger';
    } else if (message.color === '#FFA500' || message.color.toLowerCase() === 'orange') {
      slackColor = 'warning';
    } else if (message.color === '#00FF00' || message.color.toLowerCase() === 'green') {
      slackColor = 'good';
    }
  }

  try {
    const response = await axios.post(webhookUrl, {
      text: 'PowerPulse UPS Status Update',
      attachments: [
        {
          title: message.title,
          text: message.description,
          color: slackColor,
          footer: 'PowerPulse UPS Monitoring System',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
    if (error.response) {
      console.error('Slack API response:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  sendSlackNotification
};
