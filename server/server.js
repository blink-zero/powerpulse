const app = require('./app');
const axios = require('axios');
const { recordBatteryHistory } = require('./utils/batteryHistoryRecorder');

const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Set up periodic battery history recording
const BATTERY_HISTORY_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(async () => {
  try {
    // Make a request to our own API to get UPS systems data
    const response = await axios.get(`http://localhost:${PORT}/api/ups/systems`, {
      headers: {
        // Use a special header to bypass authentication for internal requests
        'X-Internal-Request': process.env.INTERNAL_API_KEY || 'powerpulse-internal'
      }
    });
    
    if (response.data && Array.isArray(response.data)) {
      // Record battery history for all UPS systems
      recordBatteryHistory(response.data);
    }
  } catch (error) {
    console.error('Error recording battery history:', error.message);
  }
}, BATTERY_HISTORY_INTERVAL);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
