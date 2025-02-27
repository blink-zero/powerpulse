const axios = require('axios');

/**
 * Send a notification to a Discord webhook
 * @param {string} webhookUrl - The Discord webhook URL
 * @param {Object} message - The message to send
 * @param {string} message.title - The title of the message
 * @param {string} message.description - The description of the message
 * @param {string} message.color - The color of the embed (in hex format)
 * @returns {Promise<Object>} - The response from the Discord API
 */
async function sendDiscordNotification(webhookUrl, message) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is required');
  }

  // Validate webhook URL format
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && 
      !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
    throw new Error('Invalid Discord webhook URL format');
  }

  // Set default color if not provided
  const color = message.color ? 
    parseInt(message.color.replace('#', ''), 16) : 
    parseInt('7289DA', 16); // Discord blue

  try {
    const response = await axios.post(webhookUrl, {
      username: 'PowerPulse UPS Monitor',
      avatar_url: 'https://i.imgur.com/4M34hi2.png', // Replace with your app icon URL
      embeds: [
        {
          title: message.title,
          description: message.description,
          color: color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'PowerPulse UPS Monitoring System'
          }
        }
      ]
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
    if (error.response) {
      console.error('Discord API response:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  sendDiscordNotification
};
