const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/**
 * @route   GET /api/user-settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', authenticateToken, (req, res) => {
  db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching user settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    // Return default settings if none exist
    if (!settings) {
      return res.json({
        inactivity_timeout: 30, // Default 30 minutes
        poll_interval: 30, // Default 30 seconds
        dark_mode: 0 // Default light mode
      });
    }
    
    return res.json(settings);
  });
});

/**
 * @route   POST /api/user-settings
 * @desc    Update user settings
 * @access  Private
 */
router.post('/', authenticateToken, (req, res) => {
  const { inactivity_timeout, poll_interval, dark_mode } = req.body;
  
  // Validate inactivity_timeout
  if (inactivity_timeout !== undefined && (isNaN(inactivity_timeout) || inactivity_timeout < 1 || inactivity_timeout > 1440)) {
    return res.status(400).json({ message: 'Inactivity timeout must be between 1 and 1440 minutes' });
  }
  
  // Validate poll_interval
  if (poll_interval !== undefined && (isNaN(poll_interval) || poll_interval < 5 || poll_interval > 300)) {
    return res.status(400).json({ message: 'Poll interval must be between 5 and 300 seconds' });
  }
  
  // Validate dark_mode
  if (dark_mode !== undefined && dark_mode !== 0 && dark_mode !== 1) {
    return res.status(400).json({ message: 'Dark mode must be 0 (light) or 1 (dark)' });
  }
  
  // Check if settings exist for this user
  db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, existingSettings) => {
    if (err) {
      console.error('Error checking user settings:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    const now = new Date().toISOString();
    
    if (existingSettings) {
      // Update existing settings
      db.run(
        `UPDATE user_settings 
         SET inactivity_timeout = ?, 
             poll_interval = ?,
             dark_mode = ?,
             updated_at = ?
         WHERE user_id = ?`,
        [
          inactivity_timeout !== undefined ? inactivity_timeout : existingSettings.inactivity_timeout || 30,
          poll_interval !== undefined ? poll_interval : existingSettings.poll_interval || 30,
          dark_mode !== undefined ? dark_mode : existingSettings.dark_mode || 0,
          now,
          req.user.id
        ],
        function(err) {
          if (err) {
            console.error('Error updating user settings:', err);
            return res.status(500).json({ message: 'Error updating user settings', error: err.message });
          }
          
          return res.json({
            message: 'User settings updated',
            inactivity_timeout: inactivity_timeout !== undefined ? inactivity_timeout : existingSettings.inactivity_timeout || 30,
            poll_interval: poll_interval !== undefined ? poll_interval : existingSettings.poll_interval || 30,
            dark_mode: dark_mode !== undefined ? dark_mode : existingSettings.dark_mode || 0
          });
        }
      );
    } else {
      // Create new settings
      db.run(
        `INSERT INTO user_settings 
         (user_id, inactivity_timeout, poll_interval, dark_mode, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          inactivity_timeout || 30,
          poll_interval || 30,
          dark_mode || 0,
          now,
          now
        ],
        function(err) {
          if (err) {
            console.error('Error creating user settings:', err);
            return res.status(500).json({ message: 'Error creating user settings', error: err.message });
          }
          
          return res.status(201).json({
            message: 'User settings created',
            inactivity_timeout: inactivity_timeout || 30,
            poll_interval: poll_interval || 30,
            dark_mode: dark_mode || 0
          });
        }
      );
    }
  });
});

module.exports = router;
