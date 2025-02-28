const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * @route   POST /api/system/update
 * @desc    Update the application by pulling the latest Docker image and restarting
 * @access  Private (Admin only)
 */
router.post('/update', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Execute the update script
    // This runs a script that will pull the latest image and restart the container
    exec('sh /app/update-container.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Update error: ${error.message}`);
        return res.status(500).json({ message: 'Update failed', error: error.message });
      }
      
      if (stderr) {
        console.error(`Update stderr: ${stderr}`);
      }
      
      console.log(`Update stdout: ${stdout}`);
      return res.json({ 
        message: 'Update initiated successfully', 
        details: 'The application will restart shortly. Please refresh the page after a minute.'
      });
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error during update process' });
  }
});

/**
 * @route   GET /api/system/version
 * @desc    Get the current application version
 * @access  Public
 */
router.get('/version', async (req, res) => {
  try {
    // Get version from package.json
    const { version } = require('../../package.json');
    res.json({ version });
  } catch (err) {
    console.error('Version check error:', err);
    res.status(500).json({ message: 'Server error while checking version' });
  }
});

module.exports = router;
