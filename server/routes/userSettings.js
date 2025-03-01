const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, (req, res) => {
  console.log(`Fetching user settings for user ${req.user.id}`);
  
  db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching user settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    // Return default settings if none exist
    if (!settings) {
      console.log(`No user settings found for user ${req.user.id}, returning defaults`);
      return res.json({
        inactivity_timeout: 30, // Default inactivity timeout in minutes
        discord_webhook_url: '',
        slack_webhook_url: '',
        notifications_enabled: 1,
        battery_notifications: 1,
        low_battery_notifications: 1,
        email_notifications: 0,
        email_recipients: '',
        poll_interval: 30 // Default poll interval in seconds
      });
    }
    
    console.log(`Found user settings for user ${req.user.id}:`, {
      inactivity_timeout: settings.inactivity_timeout,
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

// Update user settings
router.post('/', authenticateToken, (req, res) => {
  const { 
    inactivity_timeout,
    discord_webhook_url,
    slack_webhook_url,
    notifications_enabled,
    battery_notifications,
    low_battery_notifications,
    email_notifications,
    email_recipients,
    poll_interval
  } = req.body;
  
  console.log(`Received user settings update request for user ${req.user.id}:`, {
    inactivity_timeout,
    discord_webhook_url: discord_webhook_url ? 'provided' : 'not provided',
    slack_webhook_url: slack_webhook_url ? 'provided' : 'not provided',
    notifications_enabled,
    battery_notifications,
    low_battery_notifications,
    email_notifications,
    email_recipients: email_recipients ? 'provided' : 'not provided',
    poll_interval
  });
  
  // Validate inactivity timeout
  if (inactivity_timeout !== undefined && (isNaN(inactivity_timeout) || inactivity_timeout < 1 || inactivity_timeout > 1440)) {
    console.error(`Invalid inactivity timeout value: ${inactivity_timeout}`);
    return res.status(400).json({ message: 'Invalid inactivity timeout. Must be between 1 and 1440 minutes.' });
  }
  
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
    
    // Prepare the settings object with only the fields that were provided
    const settingsToUpdate = {};
    
    if (inactivity_timeout !== undefined) settingsToUpdate.inactivity_timeout = inactivity_timeout;
    if (discord_webhook_url !== undefined) settingsToUpdate.discord_webhook_url = discord_webhook_url;
    if (slack_webhook_url !== undefined) settingsToUpdate.slack_webhook_url = slack_webhook_url;
    if (notifications_enabled !== undefined) settingsToUpdate.notifications_enabled = notifications_enabled === false ? 0 : 1;
    if (battery_notifications !== undefined) settingsToUpdate.battery_notifications = battery_notifications === false ? 0 : 1;
    if (low_battery_notifications !== undefined) settingsToUpdate.low_battery_notifications = low_battery_notifications === false ? 0 : 1;
    if (email_notifications !== undefined) settingsToUpdate.email_notifications = email_notifications === true ? 1 : 0;
    if (email_recipients !== undefined) settingsToUpdate.email_recipients = email_recipients;
    if (poll_interval !== undefined) settingsToUpdate.poll_interval = poll_interval;
    
    if (existingSettings) {
      console.log(`Updating existing user settings for user ${req.user.id}`);
      
      // Build the SQL query dynamically based on the fields that were provided
      const fields = Object.keys(settingsToUpdate);
      if (fields.length === 0) {
        return res.status(400).json({ message: 'No settings provided to update' });
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => settingsToUpdate[field]);
      
      // Add updated_at and user_id to the query
      const sql = `UPDATE user_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
      values.push(req.user.id);
      
      console.log(`Executing SQL: ${sql}`);
      console.log(`With values:`, values);
      
      // Update existing settings
      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error updating user settings:', err);
          return res.status(500).json({ message: 'Error updating user settings', error: err.message });
        }
        
        console.log(`Successfully updated user settings for user ${req.user.id}`);
        
        // Verify the settings were saved correctly
        db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (verifyErr, savedSettings) => {
          if (verifyErr) {
            console.error('Error verifying saved user settings:', verifyErr);
          } else {
            console.log('Verified saved user settings:', {
              inactivity_timeout: savedSettings.inactivity_timeout,
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
        
        // Return the updated settings
        return res.json({
          message: 'User settings updated',
          ...settingsToUpdate
        });
      });
    } else {
      console.log(`Creating new user settings for user ${req.user.id}`);
      
      // Set default values for any fields that weren't provided
      const defaultValues = {
        inactivity_timeout: 30,
        discord_webhook_url: '',
        slack_webhook_url: '',
        notifications_enabled: 1,
        battery_notifications: 1,
        low_battery_notifications: 1,
        email_notifications: 0,
        email_recipients: '',
        poll_interval: 30
      };
      
      // Merge the provided settings with the default values
      const newSettings = { ...defaultValues, ...settingsToUpdate };
      
      // Build the SQL query
      const fields = Object.keys(newSettings);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(field => newSettings[field]);
      
      // Add user_id to the fields and values
      fields.push('user_id');
      values.push(req.user.id);
      
      const sql = `INSERT INTO user_settings (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      
      console.log(`Executing SQL: ${sql}`);
      console.log(`With values:`, values);
      
      // Create new settings
      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error creating user settings:', err);
          return res.status(500).json({ message: 'Error creating user settings', error: err.message });
        }
        
        console.log(`Successfully created user settings for user ${req.user.id}`);
        
        // Verify the settings were saved correctly
        db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (verifyErr, savedSettings) => {
          if (verifyErr) {
            console.error('Error verifying saved user settings:', verifyErr);
          } else {
            console.log('Verified saved user settings:', {
              inactivity_timeout: savedSettings.inactivity_timeout,
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
        
        // Return the new settings
        return res.status(201).json({
          message: 'User settings created',
          ...newSettings
        });
      });
    }
  });
});

module.exports = router;
