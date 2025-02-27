const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { sendDiscordNotification } = require('../utils/discordWebhook');
const { sendSlackNotification } = require('../utils/slackWebhook');
const { sendEmailNotification } = require('../utils/emailNotification');
const db = require('../db');

const router = express.Router();

// Get notification settings
router.get('/settings', authenticateToken, (req, res) => {
  db.get('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching notification settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    // Return default settings if none exist
    if (!settings) {
      return res.json({
        discord_webhook_url: '',
        slack_webhook_url: '',
        notifications_enabled: true,
        battery_notifications: true,
        low_battery_notifications: true,
        email_notifications: false,
        email_recipients: ''
      });
    }
    
    return res.json(settings);
  });
});

// Update notification settings
router.post('/settings', authenticateToken, (req, res) => {
  const { 
    discord_webhook_url, 
    slack_webhook_url,
    notifications_enabled, 
    battery_notifications, 
    low_battery_notifications,
    email_notifications,
    email_recipients
  } = req.body;
  
  // Validate Discord webhook URL if provided
  if (discord_webhook_url && 
      !discord_webhook_url.startsWith('https://discord.com/api/webhooks/') && 
      !discord_webhook_url.startsWith('https://discordapp.com/api/webhooks/')) {
    return res.status(400).json({ message: 'Invalid Discord webhook URL format' });
  }
  
  // Validate Slack webhook URL if provided
  if (slack_webhook_url && !slack_webhook_url.startsWith('https://hooks.slack.com/services/')) {
    return res.status(400).json({ message: 'Invalid Slack webhook URL format' });
  }
  
  // Check if settings exist for this user
  db.get('SELECT id FROM notification_settings WHERE user_id = ?', [req.user.id], (err, existingSettings) => {
    if (err) {
      console.error('Error checking notification settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (existingSettings) {
      // Update existing settings
      db.run(
        `UPDATE notification_settings 
         SET discord_webhook_url = ?, 
             slack_webhook_url = ?,
             notifications_enabled = ?, 
             battery_notifications = ?, 
             low_battery_notifications = ?,
             email_notifications = ?,
             email_recipients = ?
         WHERE user_id = ?`,
        [
          discord_webhook_url || '',
          slack_webhook_url || '',
          notifications_enabled === false ? 0 : 1,
          battery_notifications === false ? 0 : 1,
          low_battery_notifications === false ? 0 : 1,
          email_notifications === true ? 1 : 0,
          email_recipients || '',
          req.user.id
        ],
        function(err) {
          if (err) {
            console.error('Error updating notification settings:', err);
            return res.status(500).json({ message: 'Error updating notification settings', error: err.message });
          }
          
          return res.json({
            message: 'Notification settings updated',
            discord_webhook_url,
            slack_webhook_url,
            notifications_enabled: notifications_enabled !== false,
            battery_notifications: battery_notifications !== false,
            low_battery_notifications: low_battery_notifications !== false,
            email_notifications: email_notifications === true,
            email_recipients
          });
        }
      );
    } else {
      // Create new settings
      db.run(
        `INSERT INTO notification_settings 
         (user_id, discord_webhook_url, slack_webhook_url, notifications_enabled, battery_notifications, low_battery_notifications, email_notifications, email_recipients) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          discord_webhook_url || '',
          slack_webhook_url || '',
          notifications_enabled === false ? 0 : 1,
          battery_notifications === false ? 0 : 1,
          low_battery_notifications === false ? 0 : 1,
          email_notifications === true ? 1 : 0,
          email_recipients || ''
        ],
        function(err) {
          if (err) {
            console.error('Error creating notification settings:', err);
            return res.status(500).json({ message: 'Error creating notification settings', error: err.message });
          }
          
          return res.status(201).json({
            message: 'Notification settings created',
            discord_webhook_url,
            slack_webhook_url,
            notifications_enabled: notifications_enabled !== false,
            battery_notifications: battery_notifications !== false,
            low_battery_notifications: low_battery_notifications !== false,
            email_notifications: email_notifications === true,
            email_recipients
          });
        }
      );
    }
  });
});

// Send a test Discord notification
router.post('/test', authenticateToken, async (req, res) => {
  const { discord_webhook_url } = req.body;
  
  if (!discord_webhook_url) {
    return res.status(400).json({ message: 'Discord webhook URL is required' });
  }
  
  try {
    await sendDiscordNotification(discord_webhook_url, {
      title: '🔔 PowerPulse Test Notification',
      description: 'This is a test notification from PowerPulse UPS Monitoring System.',
      color: '#7289DA' // Discord blue
    });
    
    return res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({ 
      message: 'Error sending test notification', 
      error: error.message 
    });
  }
});

// Send a test Slack notification
router.post('/test-slack', authenticateToken, async (req, res) => {
  const { slack_webhook_url } = req.body;
  
  if (!slack_webhook_url) {
    return res.status(400).json({ message: 'Slack webhook URL is required' });
  }
  
  try {
    await sendSlackNotification(slack_webhook_url, {
      title: '🔔 PowerPulse Test Notification',
      description: 'This is a test notification from PowerPulse UPS Monitoring System.',
      color: 'good' // Green
    });
    
    return res.json({ message: 'Test notification sent successfully to Slack' });
  } catch (error) {
    console.error('Error sending Slack test notification:', error);
    return res.status(500).json({ 
      message: 'Error sending Slack test notification', 
      error: error.message 
    });
  }
});

// Send a test email notification
router.post('/test-email', authenticateToken, async (req, res) => {
  const { email_recipients } = req.body;
  
  if (!email_recipients) {
    return res.status(400).json({ message: 'Email recipients are required' });
  }
  
  try {
    await sendEmailNotification(email_recipients, {
      title: '🔔 PowerPulse Test Notification',
      description: 'This is a test notification from PowerPulse UPS Monitoring System.'
    });
    
    return res.json({ message: 'Test notification sent successfully to email recipients' });
  } catch (error) {
    console.error('Error sending email test notification:', error);
    return res.status(500).json({ 
      message: 'Error sending email test notification', 
      error: error.message 
    });
  }
});

// Get notification history
router.get('/history', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM notification_logs 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 100`,
    [req.user.id],
    (err, logs) => {
      if (err) {
        console.error('Error fetching notification logs:', err);
        return res.status(500).json({ 
          message: 'Error fetching notification logs', 
          error: err.message 
        });
      }
      
      return res.json(logs);
    }
  );
});

// Send a notification about UPS status change
router.post('/ups-status', authenticateToken, async (req, res) => {
  const { 
    ups_id, 
    ups_name, 
    status, 
    previous_status, 
    discord_webhook_url,
    slack_webhook_url,
    email_notifications,
    email_recipients
  } = req.body;
  
  if (!ups_id || !ups_name || !status || !previous_status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    let title, description, color;
    
    if (status.toLowerCase() === 'on battery') {
      title = '⚡ UPS On Battery';
      description = `**${ups_name}** is now running on battery power.\nPrevious status: ${previous_status}`;
      color = '#FFA500'; // Orange
    } else if (status.toLowerCase() === 'low battery') {
      title = '🔋 UPS Low Battery Warning';
      description = `**${ups_name}** has a low battery.\nPrevious status: ${previous_status}`;
      color = '#FF0000'; // Red
    } else if (status.toLowerCase() === 'online') {
      title = '✅ UPS Back Online';
      description = `**${ups_name}** is now back online.\nPrevious status: ${previous_status}`;
      color = '#00FF00'; // Green
    } else {
      title = '🔄 UPS Status Change';
      description = `**${ups_name}** status changed to ${status}.\nPrevious status: ${previous_status}`;
      color = '#7289DA'; // Discord blue
    }
    
    // Send notifications to all configured channels
    const notificationPromises = [];
    
    // Discord notification
    if (discord_webhook_url) {
      notificationPromises.push(
        sendDiscordNotification(discord_webhook_url, { title, description, color })
          .catch(err => console.error('Error sending Discord notification:', err))
      );
    }
    
    // Slack notification
    if (slack_webhook_url) {
      notificationPromises.push(
        sendSlackNotification(slack_webhook_url, { title, description, color })
          .catch(err => console.error('Error sending Slack notification:', err))
      );
    }
    
    // Email notification
    if (email_notifications && email_recipients) {
      notificationPromises.push(
        sendEmailNotification(email_recipients, { 
          title, 
          description: description.replace(/\*\*/g, '') // Remove Discord markdown
        })
          .catch(err => console.error('Error sending email notification:', err))
      );
    }
    
    // Wait for all notifications to be sent
    await Promise.allSettled(notificationPromises);
    
    // Log the notification
    db.run(
      `INSERT INTO notification_logs 
       (user_id, ups_id, ups_name, status, previous_status) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, ups_id, ups_name, status, previous_status],
      function(err) {
        if (err) {
          console.error('Error logging notification:', err);
        }
      }
    );
    
    return res.json({ message: 'Notifications sent successfully' });
  } catch (error) {
    console.error('Error sending UPS status notifications:', error);
    return res.status(500).json({ 
      message: 'Error sending notifications', 
      error: error.message 
    });
  }
});

module.exports = router;
