const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { sendDiscordNotification } = require('../utils/discordWebhook');
const { sendSlackNotification } = require('../utils/slackWebhook');
const { sendEmailNotification } = require('../utils/emailNotification');
const db = require('../db');

const router = express.Router();

// Get notification settings
router.get('/settings', authenticateToken, (req, res) => {
  console.log(`Fetching notification settings for user ${req.user.id}`);
  
  db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching notification settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    // Return default settings if none exist
    if (!settings) {
      console.log(`No settings found for user ${req.user.id}, returning defaults`);
      return res.json({
        discord_webhook_url: '',
        slack_webhook_url: '',
        notifications_enabled: true,
        battery_notifications: true,
        low_battery_notifications: true,
        email_notifications: false,
        email_recipients: '',
        poll_interval: 30 // Default poll interval in seconds
      });
    }
    
    console.log(`Found settings for user ${req.user.id}:`, {
      discord_webhook_url: settings.discord_webhook_url ? 'configured' : 'not configured',
      slack_webhook_url: settings.slack_webhook_url ? 'configured' : 'not configured',
      notifications_enabled: settings.notifications_enabled,
      battery_notifications: settings.battery_notifications,
      low_battery_notifications: settings.low_battery_notifications,
      email_notifications: settings.email_notifications,
      email_recipients: settings.email_recipients ? 'configured' : 'not configured',
      poll_interval: settings.poll_interval
    });
    
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
    email_recipients,
    poll_interval
  } = req.body;
  
  console.log('Received notification settings update request:', {
    user_id: req.user.id,
    discord_webhook_url: discord_webhook_url ? 'provided' : 'not provided',
    slack_webhook_url: slack_webhook_url ? 'provided' : 'not provided',
    notifications_enabled,
    battery_notifications,
    low_battery_notifications,
    email_notifications,
    email_recipients: email_recipients ? 'provided' : 'not provided',
    poll_interval
  });
  
  // Validate Discord webhook URL if provided
  if (discord_webhook_url && 
      !discord_webhook_url.startsWith('https://discord.com/api/webhooks/') && 
      !discord_webhook_url.startsWith('https://discordapp.com/api/webhooks/')) {
    console.error('Invalid Discord webhook URL format');
    return res.status(400).json({ message: 'Invalid Discord webhook URL format' });
  }
  
  // Validate Slack webhook URL if provided
  if (slack_webhook_url && !slack_webhook_url.startsWith('https://hooks.slack.com/services/')) {
    console.error('Invalid Slack webhook URL format');
    return res.status(400).json({ message: 'Invalid Slack webhook URL format' });
  }
  
  // Check if settings exist for this user
  db.get('SELECT id FROM user_settings WHERE user_id = ?', [req.user.id], (err, existingSettings) => {
    if (err) {
      console.error('Error checking user settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (existingSettings) {
      // Log the values being saved
      console.log('Updating existing notification settings with values:', {
        discord_webhook_url: discord_webhook_url ? 'provided' : 'not provided',
        slack_webhook_url: slack_webhook_url ? 'provided' : 'not provided',
        notifications_enabled: notifications_enabled === false ? 0 : 1,
        battery_notifications: battery_notifications === false ? 0 : 1,
        low_battery_notifications: low_battery_notifications === false ? 0 : 1,
        email_notifications: email_notifications === true ? 1 : 0,
        email_recipients: email_recipients ? 'provided' : 'not provided',
        poll_interval: poll_interval || 30,
        user_id: req.user.id
      });
      
      // Update existing settings
      db.run(
        `UPDATE user_settings 
         SET discord_webhook_url = ?, 
             slack_webhook_url = ?,
             notifications_enabled = ?, 
             battery_notifications = ?, 
             low_battery_notifications = ?,
             email_notifications = ?,
             email_recipients = ?,
             poll_interval = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          discord_webhook_url || '',
          slack_webhook_url || '',
          notifications_enabled === false ? 0 : 1,
          battery_notifications === false ? 0 : 1,
          low_battery_notifications === false ? 0 : 1,
          email_notifications === true ? 1 : 0,
          email_recipients || '',
          poll_interval || 30, // Default to 30 seconds if not provided
          req.user.id
        ],
        function(err) {
          if (err) {
            console.error('Error updating notification settings:', err);
            return res.status(500).json({ message: 'Error updating notification settings', error: err.message });
          }
          
          console.log(`Successfully updated notification settings for user ${req.user.id}`);
          
          // Verify the settings were saved correctly
          db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (verifyErr, savedSettings) => {
            if (verifyErr) {
              console.error('Error verifying saved settings:', verifyErr);
            } else {
              console.log('Verified saved settings:', {
                discord_webhook_url: savedSettings.discord_webhook_url ? 'configured' : 'not configured',
                slack_webhook_url: savedSettings.slack_webhook_url ? 'configured' : 'not configured',
                notifications_enabled: savedSettings.notifications_enabled,
                battery_notifications: savedSettings.battery_notifications,
                low_battery_notifications: savedSettings.low_battery_notifications,
                email_notifications: savedSettings.email_notifications,
                email_recipients: savedSettings.email_recipients ? 'configured' : 'not configured',
                poll_interval: savedSettings.poll_interval
              });
            }
          });
          
          return res.json({
            message: 'Notification settings updated',
            discord_webhook_url,
            slack_webhook_url,
            notifications_enabled: notifications_enabled !== false,
            battery_notifications: battery_notifications !== false,
            low_battery_notifications: low_battery_notifications !== false,
            email_notifications: email_notifications === true,
            email_recipients,
            poll_interval: poll_interval || 30
          });
        }
      );
    } else {
      // Log the values being saved
      console.log('Creating new notification settings with values:', {
        discord_webhook_url: discord_webhook_url ? 'provided' : 'not provided',
        slack_webhook_url: slack_webhook_url ? 'provided' : 'not provided',
        notifications_enabled: notifications_enabled === false ? 0 : 1,
        battery_notifications: battery_notifications === false ? 0 : 1,
        low_battery_notifications: low_battery_notifications === false ? 0 : 1,
        email_notifications: email_notifications === true ? 1 : 0,
        email_recipients: email_recipients ? 'provided' : 'not provided',
        poll_interval: poll_interval || 30,
        user_id: req.user.id
      });
      
      // Create new settings
      db.run(
        `INSERT INTO user_settings 
         (user_id, discord_webhook_url, slack_webhook_url, notifications_enabled, battery_notifications, low_battery_notifications, email_notifications, email_recipients, poll_interval, inactivity_timeout, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          req.user.id,
          discord_webhook_url || '',
          slack_webhook_url || '',
          notifications_enabled === false ? 0 : 1,
          battery_notifications === false ? 0 : 1,
          low_battery_notifications === false ? 0 : 1,
          email_notifications === true ? 1 : 0,
          email_recipients || '',
          poll_interval || 30 // Default to 30 seconds if not provided
        ],
        function(err) {
          if (err) {
            console.error('Error creating notification settings:', err);
            return res.status(500).json({ message: 'Error creating notification settings', error: err.message });
          }
          
          console.log(`Successfully created notification settings for user ${req.user.id}`);
          
          // Verify the settings were saved correctly
          db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (verifyErr, savedSettings) => {
            if (verifyErr) {
              console.error('Error verifying saved settings:', verifyErr);
            } else {
              console.log('Verified saved settings:', {
                discord_webhook_url: savedSettings.discord_webhook_url ? 'configured' : 'not configured',
                slack_webhook_url: savedSettings.slack_webhook_url ? 'configured' : 'not configured',
                notifications_enabled: savedSettings.notifications_enabled,
                battery_notifications: savedSettings.battery_notifications,
                low_battery_notifications: savedSettings.low_battery_notifications,
                email_notifications: savedSettings.email_notifications,
                email_recipients: savedSettings.email_recipients ? 'configured' : 'not configured',
                poll_interval: savedSettings.poll_interval
              });
            }
          });
          
          return res.status(201).json({
            message: 'Notification settings created',
            discord_webhook_url,
            slack_webhook_url,
            notifications_enabled: notifications_enabled !== false,
            battery_notifications: battery_notifications !== false,
            low_battery_notifications: low_battery_notifications !== false,
            email_notifications: email_notifications === true,
            email_recipients,
            poll_interval: poll_interval || 30
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

// Debug endpoint to test notifications with specific status
router.post('/debug-status-notification', authenticateToken, async (req, res) => {
  const { 
    status = 'On Battery',
    previous_status = 'Online',
    ups_name = 'Test UPS',
    discord_webhook_url,
    slack_webhook_url,
    email_notifications,
    email_recipients
  } = req.body;
  
  try {
    let title, description, color;
    
    if (status === 'On Battery') {
      title = '⚡ UPS On Battery';
      description = `**${ups_name}** is now running on battery power.\nPrevious status: ${previous_status}`;
      color = '#FFA500'; // Orange
    } else if (status === 'Low Battery') {
      title = '🔋 UPS Low Battery Warning';
      description = `**${ups_name}** has a low battery.\nPrevious status: ${previous_status}`;
      color = '#FF0000'; // Red
    } else if (status === 'Online') {
      title = '✅ UPS Back Online';
      description = `**${ups_name}** is now back online.\nPrevious status: ${previous_status}`;
      color = '#00FF00'; // Green
    } else {
      title = '🔄 UPS Status Change';
      description = `**${ups_name}** status changed to ${status}.\nPrevious status: ${previous_status}`;
      color = '#7289DA'; // Discord blue
    }
    
    // Send notifications to all configured channels
    const results = {
      discord: null,
      slack: null,
      email: null
    };
    
    console.log('Sending DEBUG UPS status notifications:');
    console.log(`- Status: ${status}`);
    console.log(`- Previous status: ${previous_status}`);
    console.log(`- UPS: ${ups_name}`);
    
    // Discord notification
    if (discord_webhook_url) {
      console.log(`- Discord webhook configured: ${discord_webhook_url.substring(0, 30)}...`);
      try {
        const discordResult = await sendDiscordNotification(discord_webhook_url, { title, description, color });
        console.log('✅ Discord notification sent successfully');
        results.discord = { success: true };
      } catch (err) {
        console.error('❌ Error sending Discord notification:', err);
        results.discord = { success: false, error: err.message };
      }
    } else {
      console.log('- No Discord webhook configured');
    }
    
    // Slack notification
    if (slack_webhook_url) {
      console.log(`- Slack webhook configured: ${slack_webhook_url.substring(0, 30)}...`);
      try {
        const slackResult = await sendSlackNotification(slack_webhook_url, { title, description, color });
        console.log('✅ Slack notification sent successfully');
        results.slack = { success: true };
      } catch (err) {
        console.error('❌ Error sending Slack notification:', err);
        results.slack = { success: false, error: err.message };
      }
    } else {
      console.log('- No Slack webhook configured');
    }
    
    // Email notification
    if (email_notifications && email_recipients) {
      console.log(`- Email notifications enabled for: ${email_recipients}`);
      try {
        const emailResult = await sendEmailNotification(email_recipients, { 
          title, 
          description: description.replace(/\*\*/g, '') // Remove Discord markdown
        });
        console.log('✅ Email notification sent successfully');
        results.email = { success: true };
      } catch (err) {
        console.error('❌ Error sending email notification:', err);
        results.email = { success: false, error: err.message };
      }
    } else {
      console.log('- No email notifications configured');
    }
    
    return res.json({ 
      message: 'Debug notifications processed',
      results
    });
  } catch (error) {
    console.error('Error sending debug notifications:', error);
    return res.status(500).json({ 
      message: 'Error sending debug notifications', 
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
    
    if (status === 'On Battery') {
      title = '⚡ UPS On Battery';
      description = `**${ups_name}** is now running on battery power.\nPrevious status: ${previous_status}`;
      color = '#FFA500'; // Orange
    } else if (status === 'Low Battery') {
      title = '🔋 UPS Low Battery Warning';
      description = `**${ups_name}** has a low battery.\nPrevious status: ${previous_status}`;
      color = '#FF0000'; // Red
    } else if (status === 'Online') {
      title = '✅ UPS Back Online';
      description = `**${ups_name}** is now back online.\nPrevious status: ${previous_status}`;
      color = '#00FF00'; // Green
    } else {
      title = '🔄 UPS Status Change';
      description = `**${ups_name}** status changed to ${status}.\nPrevious status: ${previous_status}`;
      color = '#7289DA'; // Discord blue
    }
    
    // Send notifications to all configured channels
    const results = {
      discord: null,
      slack: null,
      email: null
    };
    
    console.log('Sending UPS status notifications:');
    console.log(`- Status: ${status}`);
    console.log(`- Previous status: ${previous_status}`);
    console.log(`- UPS: ${ups_name} (ID: ${ups_id})`);
    
    // Discord notification
    if (discord_webhook_url) {
      console.log(`- Discord webhook configured: ${discord_webhook_url.substring(0, 30)}...`);
      try {
        const discordResult = await sendDiscordNotification(discord_webhook_url, { title, description, color });
        console.log('✅ Discord notification sent successfully');
        results.discord = { success: true };
      } catch (err) {
        console.error('❌ Error sending Discord notification:', err);
        results.discord = { success: false, error: err.message };
      }
    } else {
      console.log('- No Discord webhook configured');
    }
    
    // Slack notification
    if (slack_webhook_url) {
      console.log(`- Slack webhook configured: ${slack_webhook_url.substring(0, 30)}...`);
      try {
        const slackResult = await sendSlackNotification(slack_webhook_url, { title, description, color });
        console.log('✅ Slack notification sent successfully');
        results.slack = { success: true };
      } catch (err) {
        console.error('❌ Error sending Slack notification:', err);
        results.slack = { success: false, error: err.message };
      }
    } else {
      console.log('- No Slack webhook configured');
    }
    
    // Email notification
    if (email_notifications && email_recipients) {
      console.log(`- Email notifications enabled for: ${email_recipients}`);
      try {
        const emailResult = await sendEmailNotification(email_recipients, { 
          title, 
          description: description.replace(/\*\*/g, '') // Remove Discord markdown
        });
        console.log('✅ Email notification sent successfully');
        results.email = { success: true };
      } catch (err) {
        console.error('❌ Error sending email notification:', err);
        results.email = { success: false, error: err.message };
      }
    } else {
      console.log('- No email notifications configured');
    }
    
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
