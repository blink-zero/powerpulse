const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Debug endpoint to directly fetch battery history from the database
router.get('/battery-history/:upsId', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.upsId);
  const days = parseInt(req.query.days) || 7; // Default to 7 days
  
  console.log(`Debug: Fetching battery history for UPS ${upsId} for the last ${days} days`);
  
  // Calculate the date for N days ago
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  const daysAgoStr = daysAgo.toISOString();
  
  console.log(`Debug: Filtering battery history from ${daysAgoStr} to now`);
  
  // Get battery history for this UPS for the last N days
  db.all(
    'SELECT * FROM battery_history WHERE ups_id = ? AND timestamp >= ? ORDER BY timestamp ASC',
    [upsId, daysAgoStr],
    (err, history) => {
      if (err) {
        console.error(`Debug: Error fetching battery history: ${err.message}`);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      console.log(`Debug: Found ${history?.length || 0} battery history records in the last ${days} days`);
      
      if (history && history.length > 0) {
        // Log the date range of the returned data
        const oldestRecord = new Date(history[0].timestamp);
        const newestRecord = new Date(history[history.length - 1].timestamp);
        console.log(`Debug: Date range of returned data: ${oldestRecord.toISOString()} to ${newestRecord.toISOString()}`);
        
        // Calculate how many hours of data we have
        const hoursDiff = (newestRecord - oldestRecord) / (1000 * 60 * 60);
        console.log(`Debug: Data spans approximately ${hoursDiff.toFixed(1)} hours (${(hoursDiff / 24).toFixed(1)} days)`);
      }
      
      // Return the raw data
      return res.json(history || []);
    }
  );
});

// Debug endpoint to manually record battery charge
router.post('/record-battery/:upsId/:charge', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.upsId);
  const chargePercent = parseFloat(req.params.charge);
  
  if (isNaN(chargePercent) || chargePercent < 0 || chargePercent > 100) {
    return res.status(400).json({ message: 'Invalid charge percentage' });
  }
  
  console.log(`Debug: Recording battery charge ${chargePercent}% for UPS ${upsId}`);
  
  // Record battery charge
  db.run(
    'INSERT INTO battery_history (ups_id, charge_percent) VALUES (?, ?)',
    [upsId, chargePercent],
    function(err) {
      if (err) {
        console.error(`Debug: Error recording battery charge: ${err.message}`);
        return res.status(500).json({ message: 'Error recording battery charge', error: err.message });
      }
      
      console.log(`Debug: Battery charge recorded with ID ${this.lastID}`);
      
      return res.status(201).json({
        message: 'Battery charge recorded',
        id: this.lastID,
        upsId,
        chargePercent,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Debug endpoint to list all tables in the database
router.get('/tables', authenticateToken, (req, res) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table'",
    (err, tables) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(tables);
    }
  );
});

// Debug endpoint to show table schema
router.get('/schema/:table', authenticateToken, (req, res) => {
  const tableName = req.params.table;
  
  db.all(
    `PRAGMA table_info(${tableName})`,
    (err, columns) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(columns);
    }
  );
});

// Debug endpoint to test the UPS monitoring system
router.post('/test-ups-monitoring', authenticateToken, async (req, res) => {
  const { 
    ups_id = 1, // Default to first UPS
    ups_name, // Optional UPS name for virtual UPS
    server_id, // Optional server ID for virtual UPS
    new_status = 'On Battery',
    old_status = 'Online'
  } = req.body;
  
  try {
    const { forceNotificationTest } = require('../utils/upsMonitor');
    
    // If ups_name and server_id are provided, create a virtual UPS ID
    let upsId = ups_id;
    if (ups_name && server_id) {
      upsId = `virtual-${server_id}-${ups_name}`;
      console.log(`Testing with virtual UPS: ${upsId}`);
    }
    
    console.log(`Testing UPS monitoring system with UPS ID ${upsId}, status change ${old_status} -> ${new_status}`);
    
    const result = await forceNotificationTest(upsId, new_status, old_status);
    
    return res.json({
      message: 'UPS monitoring test completed',
      result
    });
  } catch (error) {
    console.error('Error testing UPS monitoring system:', error);
    return res.status(500).json({
      message: 'Error testing UPS monitoring system',
      error: error.message
    });
  }
});

// Debug endpoint to force a UPS status change
router.post('/force-status-change', authenticateToken, async (req, res) => {
  const { 
    ups_id = 1, // Default to first UPS
    new_status = 'On Battery',
    old_status = 'Online'
  } = req.body;
  
  console.log(`Debug: Forcing UPS ${ups_id} status change from ${old_status} to ${new_status}`);
  
  try {
    // Get the UPS system from the database
    db.get('SELECT * FROM ups_systems WHERE id = ?', [ups_id], async (err, upsSystem) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (!upsSystem) {
        return res.status(404).json({ message: 'UPS system not found' });
      }
      
      // Get all users with notification settings
      db.all('SELECT user_id FROM notification_settings WHERE notifications_enabled = 1', async (err, users) => {
        if (err) {
          console.error('Error fetching users with notifications enabled:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (!users || users.length === 0) {
          return res.status(404).json({ message: 'No users with notifications enabled' });
        }
        
        // For each user, send a notification
        const notificationPromises = users.map(async (user) => {
          // Get user's notification settings
          return new Promise((resolve, reject) => {
            db.get('SELECT * FROM notification_settings WHERE user_id = ?', [user.user_id], async (err, settings) => {
              if (err) {
                console.error(`Error fetching notification settings for user ${user.user_id}:`, err);
                resolve({ user_id: user.user_id, success: false, error: err.message });
                return;
              }
              
              if (!settings) {
                resolve({ user_id: user.user_id, success: false, error: 'No notification settings found' });
                return;
              }
              
              try {
                // Prepare notification data
                const notificationData = {
                  ups_id,
                  ups_name: upsSystem.name,
                  status: new_status,
                  previous_status: old_status,
                  discord_webhook_url: settings.discord_webhook_url,
                  slack_webhook_url: settings.slack_webhook_url,
                  email_notifications: settings.email_notifications === 1,
                  email_recipients: settings.email_recipients
                };
                
                // Send notification directly to the notifications API
                console.log(`Sending forced notification for user ${user.user_id}:`, notificationData);
                
                // Send notification using the notifications API
                try {
                  const { sendDiscordNotification } = require('../utils/discordWebhook');
                  const { sendSlackNotification } = require('../utils/slackWebhook');
                  const { sendEmailNotification } = require('../utils/emailNotification');
                  
                  // Prepare notification message
                  let title, description, color;
                  
                  if (new_status === 'On Battery') {
                    title = '⚡ UPS On Battery';
                    description = `**${upsSystem.name}** is now running on battery power.\nPrevious status: ${old_status}`;
                    color = '#FFA500'; // Orange
                  } else if (new_status === 'Low Battery') {
                    title = '🔋 UPS Low Battery Warning';
                    description = `**${upsSystem.name}** has a low battery.\nPrevious status: ${old_status}`;
                    color = '#FF0000'; // Red
                  } else if (new_status === 'Online') {
                    title = '✅ UPS Back Online';
                    description = `**${upsSystem.name}** is now back online.\nPrevious status: ${old_status}`;
                    color = '#00FF00'; // Green
                  } else {
                    title = '🔄 UPS Status Change';
                    description = `**${upsSystem.name}** status changed to ${new_status}.\nPrevious status: ${old_status}`;
                    color = '#7289DA'; // Discord blue
                  }
                  
                  // Send notifications to all configured channels
                  const results = {
                    discord: null,
                    slack: null,
                    email: null
                  };
                  
                  // Discord notification
                  if (settings.discord_webhook_url) {
                    console.log(`- Discord webhook configured for user ${user.user_id}`);
                    try {
                      await sendDiscordNotification(settings.discord_webhook_url, { title, description, color });
                      console.log('✅ Discord notification sent successfully');
                      results.discord = { success: true };
                    } catch (err) {
                      console.error('❌ Error sending Discord notification:', err);
                      results.discord = { success: false, error: err.message };
                    }
                  }
                  
                  // Slack notification
                  if (settings.slack_webhook_url) {
                    console.log(`- Slack webhook configured for user ${user.user_id}`);
                    try {
                      await sendSlackNotification(settings.slack_webhook_url, { title, description, color });
                      console.log('✅ Slack notification sent successfully');
                      results.slack = { success: true };
                    } catch (err) {
                      console.error('❌ Error sending Slack notification:', err);
                      results.slack = { success: false, error: err.message };
                    }
                  }
                  
                  // Email notification
                  if (settings.email_notifications === 1 && settings.email_recipients) {
                    console.log(`- Email notifications enabled for user ${user.user_id}`);
                    try {
                      await sendEmailNotification(settings.email_recipients, { 
                        title, 
                        description: description.replace(/\*\*/g, '') // Remove Discord markdown
                      });
                      console.log('✅ Email notification sent successfully');
                      results.email = { success: true };
                    } catch (err) {
                      console.error('❌ Error sending email notification:', err);
                      results.email = { success: false, error: err.message };
                    }
                  }
                  
                  // Log the notification
                  db.run(
                    `INSERT INTO notification_logs 
                     (user_id, ups_id, ups_name, status, previous_status) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [user.user_id, ups_id, upsSystem.name, new_status, old_status],
                    function(err) {
                      if (err) {
                        console.error('Error logging notification:', err);
                      }
                    }
                  );
                  
                  resolve({ user_id: user.user_id, success: true, results });
                } catch (error) {
                  console.error(`Error sending notification for user ${user.user_id}:`, error);
                  resolve({ user_id: user.user_id, success: false, error: error.message });
                }
              } catch (error) {
                console.error(`Error processing notification for user ${user.user_id}:`, error);
                resolve({ user_id: user.user_id, success: false, error: error.message });
              }
            });
          });
        });
        
        // Wait for all notifications to be sent
        const results = await Promise.all(notificationPromises);
        
        return res.json({
          message: 'Forced status change notifications processed',
          ups_id,
          old_status,
          new_status,
          results
        });
      });
    });
  } catch (error) {
    console.error('Error in force status change endpoint:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to get raw UPS status values
router.get('/ups-status-raw', authenticateToken, async (req, res) => {
  try {
    // Get all NUT servers
    db.all('SELECT id, host, port, username, password FROM nut_servers', async (err, servers) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (servers.length === 0) {
        return res.status(404).json({ message: 'No NUT servers configured' });
      }
      
      const { getNutUpsData } = require('../utils/nutClient');
      
      // Get UPS data from all servers
      const allData = [];
      
      for (const server of servers) {
        try {
          console.log(`Debug: Fetching UPS data from ${server.host}:${server.port}`);
          
          // Get raw UPS data
          const upsData = await getNutUpsData(server.host, server.port, server.username, server.password);
          
          // Add server info to each UPS
          const serverUpsData = upsData.map(ups => ({
            ...ups,
            server: {
              id: server.id,
              host: server.host,
              port: server.port
            },
            raw_status: ups.status, // Store the raw status before any translation
          }));
          
          allData.push(...serverUpsData);
        } catch (serverErr) {
          console.error(`Error connecting to NUT server ${server.host}:${server.port}:`, serverErr);
          allData.push({
            error: `Failed to connect to ${server.host}:${server.port}`,
            message: serverErr.message,
            server: {
              id: server.id,
              host: server.host,
              port: server.port
            }
          });
        }
      }
      
      return res.json(allData);
    });
  } catch (error) {
    console.error('Error in debug UPS status endpoint:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to count records in a table
router.get('/count/:table', authenticateToken, (req, res) => {
  const tableName = req.params.table;
  
  db.get(
    `SELECT COUNT(*) as count FROM ${tableName}`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(result);
    }
  );
});

// Debug endpoint to check notification settings
router.get('/notification-settings', authenticateToken, (req, res) => {
  db.get('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching notification settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!settings) {
      return res.status(404).json({ message: 'No notification settings found for this user' });
    }
    
    // Return settings with masked webhook URLs for security
    return res.json({
      notifications_enabled: settings.notifications_enabled === 1,
      battery_notifications: settings.battery_notifications === 1,
      low_battery_notifications: settings.low_battery_notifications === 1,
      discord_webhook_url: settings.discord_webhook_url ? 'Configured' : 'Not configured',
      slack_webhook_url: settings.slack_webhook_url ? 'Configured' : 'Not configured',
      email_notifications: settings.email_notifications === 1,
      email_recipients: settings.email_recipients || 'None'
    });
  });
});

// Debug endpoint to directly test notification with raw status values
router.post('/raw-notification-test', authenticateToken, async (req, res) => {
  const { 
    status = 'OB', // Raw NUT status code (OB = On Battery)
    webhook_url,
    webhook_type = 'discord' // 'discord' or 'slack'
  } = req.body;
  
  console.log(`Debug: Testing raw notification with status: ${status}`);
  
  try {
    // Translate status code to human-readable format
    let statusDisplay = status;
    
    // Common NUT status codes
    if (status.includes('OL')) {
      statusDisplay = 'Online';
    } else if (status.includes('OB')) {
      statusDisplay = 'On Battery';
    } else if (status.includes('LB')) {
      statusDisplay = 'Low Battery';
    }
    
    console.log(`Debug: Translated status: ${statusDisplay}`);
    
    // Create notification message
    let title, description, color;
    
    if (statusDisplay === 'On Battery') {
      title = '⚡ UPS On Battery';
      description = `**Debug UPS** is now running on battery power.\nPrevious status: Online`;
      color = '#FFA500'; // Orange
    } else if (statusDisplay === 'Low Battery') {
      title = '🔋 UPS Low Battery Warning';
      description = `**Debug UPS** has a low battery.\nPrevious status: On Battery`;
      color = '#FF0000'; // Red
    } else if (statusDisplay === 'Online') {
      title = '✅ UPS Back Online';
      description = `**Debug UPS** is now back online.\nPrevious status: On Battery`;
      color = '#00FF00'; // Green
    } else {
      title = '🔄 UPS Status Change';
      description = `**Debug UPS** status changed to ${statusDisplay}.\nPrevious status: Unknown`;
      color = '#7289DA'; // Discord blue
    }
    
    // Send notification based on webhook type
    let result;
    if (webhook_type === 'discord' && webhook_url) {
      console.log('Debug: Sending Discord notification');
      const { sendDiscordNotification } = require('../utils/discordWebhook');
      result = await sendDiscordNotification(webhook_url, { title, description, color });
      console.log('Debug: Discord notification sent successfully');
    } else if (webhook_type === 'slack' && webhook_url) {
      console.log('Debug: Sending Slack notification');
      const { sendSlackNotification } = require('../utils/slackWebhook');
      result = await sendSlackNotification(webhook_url, { title, description, color });
      console.log('Debug: Slack notification sent successfully');
    } else {
      return res.status(400).json({ message: 'Invalid webhook type or missing webhook URL' });
    }
    
    return res.json({
      message: 'Raw notification test sent successfully',
      status: status,
      translated_status: statusDisplay,
      webhook_type: webhook_type,
      result: 'Success'
    });
  } catch (error) {
    console.error('Error sending raw notification test:', error);
    return res.status(500).json({
      message: 'Error sending raw notification test',
      error: error.message,
      status: status
    });
  }
});

// Debug endpoint to simulate a UPS status change
router.post('/test-notification', authenticateToken, async (req, res) => {
  const { 
    status = 'On Battery',
    previous_status = 'Online',
    ups_name = 'Debug UPS',
    ups_id = 999
  } = req.body;
  
  try {
    // Get user's notification settings
    db.get('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id], async (err, settings) => {
      if (err) {
        console.error('Error fetching notification settings:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (!settings) {
        return res.status(404).json({ message: 'No notification settings found for this user' });
      }
      
      // Check if notifications are enabled
      if (!settings.notifications_enabled) {
        return res.status(400).json({ message: 'Notifications are disabled for this user' });
      }
      
      // Prepare notification data
      const notificationData = {
        ups_id,
        ups_name,
        status,
        previous_status,
        discord_webhook_url: settings.discord_webhook_url,
        slack_webhook_url: settings.slack_webhook_url,
        email_notifications: settings.email_notifications === 1,
        email_recipients: settings.email_recipients
      };
      
      // Send notification using the notifications API
      try {
        const response = await axios.post('/api/notifications/ups-status', notificationData);
        return res.json({ 
          message: 'Debug notification sent successfully',
          settings: {
            discord_webhook_url: settings.discord_webhook_url ? 'Configured' : 'Not configured',
            slack_webhook_url: settings.slack_webhook_url ? 'Configured' : 'Not configured',
            email_notifications: settings.email_notifications === 1,
            email_recipients: settings.email_recipients || 'None'
          },
          response: response.data
        });
      } catch (error) {
        console.error('Error sending debug notification:', error);
        return res.status(500).json({ 
          message: 'Error sending debug notification', 
          error: error.message,
          settings: {
            discord_webhook_url: settings.discord_webhook_url ? 'Configured' : 'Not configured',
            slack_webhook_url: settings.slack_webhook_url ? 'Configured' : 'Not configured',
            email_notifications: settings.email_notifications === 1,
            email_recipients: settings.email_recipients || 'None'
          }
        });
      }
    });
  } catch (error) {
    console.error('Error in debug notification endpoint:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
