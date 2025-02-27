const db = require('../db');
const { getNutUpsData } = require('./nutClient');
const { sendDiscordNotification } = require('./discordWebhook');
const { sendSlackNotification } = require('./slackWebhook');
const { sendEmailNotification } = require('./emailNotification');

// Store previous UPS states (in-memory cache)
const previousUpsStates = new Map();

// Store UPS status in database and memory
function storeUpsStatus(upsId, status) {
  // Update in-memory cache
  previousUpsStates.set(upsId, { status });
  
  // Store in database
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO ups_status (ups_id, status, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(ups_id) DO UPDATE SET 
       status = ?, updated_at = ?`,
      [upsId, status, now, status, now],
      function(err) {
        if (err) {
          console.error(`Error storing UPS status in database: ${err.message}`);
          // Still resolve since we updated the in-memory cache
          resolve();
        } else {
          console.log(`Stored status for UPS ${upsId}: ${status} (in memory and database)`);
          resolve();
        }
      }
    );
  });
}

// Load UPS status from database, fallback to memory
function loadUpsStatus(upsId) {
  return new Promise((resolve, reject) => {
    // First try to get from database
    db.get('SELECT status FROM ups_status WHERE ups_id = ?', [upsId], (err, row) => {
      if (err) {
        console.error(`Error loading UPS status from database: ${err.message}`);
        // Fallback to in-memory cache
        const state = previousUpsStates.get(upsId);
        resolve(state ? state.status : null);
      } else if (row) {
        // Update in-memory cache with database value
        previousUpsStates.set(upsId, { status: row.status });
        resolve(row.status);
      } else {
        // Not found in database, try in-memory cache
        const state = previousUpsStates.get(upsId);
        resolve(state ? state.status : null);
      }
    });
  });
}

// Ensure the ups_status table exists
async function ensureUpsStatusTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS ups_status (
        ups_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error(`Error creating ups_status table: ${err.message}`);
          console.log('Using in-memory storage for UPS status (database is read-only)');
          resolve();
        } else {
          console.log('UPS status table created or already exists');
          resolve();
        }
      }
    );
  });
}

// Check interval in milliseconds (1 minute)
const CHECK_INTERVAL_MS = 60 * 1000;

// Timer reference
let checkTimer = null;

/**
 * Initialize the UPS status checker
 */
async function initUpsStatusChecker() {
  console.log('Initializing UPS status checker...');
  
  // Clear any existing timer
  if (checkTimer) {
    clearInterval(checkTimer);
  }
  
  // Ensure the ups_status table exists
  await ensureUpsStatusTable();
  
  // Start with an immediate check
  checkUpsStatus();
  
  // Set up regular interval checks
  checkTimer = setInterval(checkUpsStatus, CHECK_INTERVAL_MS);
  
  console.log(`UPS status checker initialized. Will check every ${CHECK_INTERVAL_MS / 1000} seconds.`);
}

/**
 * Check the status of all UPS systems
 */
async function checkUpsStatus() {
  console.log('Checking UPS status...');
  
  try {
    // Get all NUT servers
    db.all('SELECT id, host, port, username, password FROM nut_servers', async (err, servers) => {
      if (err) {
        console.error('Error fetching NUT servers:', err.message);
        return;
      }
      
      if (!servers || servers.length === 0) {
        console.log('No NUT servers configured. Skipping UPS status check.');
        return;
      }
      
      // Get UPS data from all servers
      const allUpsData = [];
      
      for (const server of servers) {
        try {
          const nutHost = server.host;
          const nutPort = server.port || 3493;
          const nutUsername = server.username;
          const nutPassword = server.password;
          
          console.log(`Checking UPS status from NUT server at ${nutHost}:${nutPort}`);
          
          const upsData = await getNutUpsData(nutHost, nutPort, nutUsername, nutPassword);
          
          // Map UPS data to include server ID
          const mappedUpsData = upsData.map(ups => ({
            ...ups,
            nutServerId: server.id
          }));
          
          allUpsData.push(...mappedUpsData);
        } catch (serverErr) {
          console.error(`Error connecting to NUT server ${server.host}:${server.port}:`, serverErr);
          // Continue with other servers even if one fails
        }
      }
      
      // Get all UPS systems from database
      db.all('SELECT * FROM ups_systems', async (err, dbSystems) => {
        if (err) {
          console.error('Error fetching UPS systems:', err.message);
          return;
        }
        
        // Process each UPS system
        for (const dbSystem of dbSystems) {
          // Find matching UPS in live data
          const liveUps = allUpsData.find(ups => 
            ups.name === dbSystem.ups_name && 
            ups.nutServerId === dbSystem.nut_server_id
          );
          
          if (!liveUps) {
            console.log(`No live data found for UPS ${dbSystem.name} (${dbSystem.id})`);
            continue;
          }
          
          // Get previous state
          const prevState = previousUpsStates.get(dbSystem.id);
          
          // Try to load previous status from database
          const dbStatus = await loadUpsStatus(dbSystem.id);
          
          // Skip if no previous state (first check)
          if (!prevState && !dbStatus) {
            console.log(`First check for UPS ${dbSystem.name} (${dbSystem.id}). Status: ${liveUps.status}`);
            previousUpsStates.set(dbSystem.id, {
              status: liveUps.status,
              batteryCharge: liveUps.batteryCharge
            });
            // Store initial status in database
            await storeUpsStatus(dbSystem.id, liveUps.status);
            continue;
          }
          
          // Use database status if available, otherwise use in-memory status
          const previousStatus = dbStatus || (prevState ? prevState.status : null);
          
          // Check for status changes
          if (previousStatus !== liveUps.status) {
            console.log(`UPS ${dbSystem.name} (${dbSystem.id}) status changed from "${previousStatus}" to "${liveUps.status}"`);
            
            // Send notifications to all users with notifications enabled
            sendStatusChangeNotifications(dbSystem, liveUps.status, previousStatus);
            
            // Store new status in database
            await storeUpsStatus(dbSystem.id, liveUps.status);
          }
          
          // Update in-memory state
          previousUpsStates.set(dbSystem.id, {
            status: liveUps.status,
            batteryCharge: liveUps.batteryCharge
          });
        }
      });
    });
  } catch (error) {
    console.error('Error checking UPS status:', error);
  }
}

/**
 * Send notifications to all users with notifications enabled
 * @param {Object} upsSystem - UPS system from database
 * @param {string} newStatus - New UPS status
 * @param {string} oldStatus - Previous UPS status
 */
async function sendStatusChangeNotifications(upsSystem, newStatus, oldStatus) {
  try {
    // Get all users with notifications enabled
    db.all('SELECT user_id FROM notification_settings WHERE notifications_enabled = 1', async (err, users) => {
      if (err) {
        console.error('Error fetching users with notifications enabled:', err);
        return;
      }
      
      if (!users || users.length === 0) {
        console.log('No users with notifications enabled. Skipping notifications.');
        return;
      }
      
      console.log(`Sending status change notifications to ${users.length} users...`);
      
      // For each user, check notification settings and send notifications
      for (const user of users) {
        try {
          // Get user's notification settings
          db.get('SELECT * FROM notification_settings WHERE user_id = ?', [user.user_id], async (err, settings) => {
            if (err) {
              console.error(`Error fetching notification settings for user ${user.user_id}:`, err);
              return;
            }
            
            if (!settings) {
              console.log(`No notification settings found for user ${user.user_id}`);
              return;
            }
            
            // Check if notifications are enabled for this status change
            const isBatteryNotification = settings.battery_notifications === 1 && 
                                         newStatus === 'On Battery' && 
                                         oldStatus !== 'On Battery';
            
            const isLowBatteryNotification = settings.low_battery_notifications === 1 && 
                                            newStatus === 'Low Battery' && 
                                            oldStatus !== 'Low Battery';
            
            const isOnlineNotification = newStatus === 'Online' && 
                                        oldStatus !== 'Online';
            
            // Skip if no notification should be sent
            if (!isBatteryNotification && !isLowBatteryNotification && !isOnlineNotification) {
              console.log(`No notification needed for user ${user.user_id} (status change: ${oldStatus} -> ${newStatus})`);
              return;
            }
            
            console.log(`Sending notification to user ${user.user_id} for status change: ${oldStatus} -> ${newStatus}`);
            
            // Prepare notification message
            let title, description, color;
            
            if (newStatus === 'On Battery') {
              title = '⚡ UPS On Battery';
              description = `**${upsSystem.name}** is now running on battery power.\nPrevious status: ${oldStatus}`;
              color = '#FFA500'; // Orange
            } else if (newStatus === 'Low Battery') {
              title = '🔋 UPS Low Battery Warning';
              description = `**${upsSystem.name}** has a low battery.\nPrevious status: ${oldStatus}`;
              color = '#FF0000'; // Red
            } else if (newStatus === 'Online') {
              title = '✅ UPS Back Online';
              description = `**${upsSystem.name}** is now back online.\nPrevious status: ${oldStatus}`;
              color = '#00FF00'; // Green
            } else {
              title = '🔄 UPS Status Change';
              description = `**${upsSystem.name}** status changed to ${newStatus}.\nPrevious status: ${oldStatus}`;
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
              try {
                await sendDiscordNotification(settings.discord_webhook_url, { title, description, color });
                console.log(`✅ Discord notification sent successfully to user ${user.user_id}`);
                results.discord = { success: true };
              } catch (err) {
                console.error(`❌ Error sending Discord notification to user ${user.user_id}:`, err);
                results.discord = { success: false, error: err.message };
              }
            }
            
            // Slack notification
            if (settings.slack_webhook_url) {
              try {
                await sendSlackNotification(settings.slack_webhook_url, { title, description, color });
                console.log(`✅ Slack notification sent successfully to user ${user.user_id}`);
                results.slack = { success: true };
              } catch (err) {
                console.error(`❌ Error sending Slack notification to user ${user.user_id}:`, err);
                results.slack = { success: false, error: err.message };
              }
            }
            
            // Email notification
            if (settings.email_notifications === 1 && settings.email_recipients) {
              try {
                await sendEmailNotification(settings.email_recipients, { 
                  title, 
                  description: description.replace(/\*\*/g, '') // Remove Discord markdown
                });
                console.log(`✅ Email notification sent successfully to user ${user.user_id}`);
                results.email = { success: true };
              } catch (err) {
                console.error(`❌ Error sending email notification to user ${user.user_id}:`, err);
                results.email = { success: false, error: err.message };
              }
            }
            
            // Log the notification
            db.run(
              `INSERT INTO notification_logs 
               (user_id, ups_id, ups_name, status, previous_status) 
               VALUES (?, ?, ?, ?, ?)`,
              [user.user_id, upsSystem.id, upsSystem.name, newStatus, oldStatus],
              function(err) {
                if (err) {
                  console.error('Error logging notification:', err);
                }
              }
            );
          });
        } catch (userErr) {
          console.error(`Error processing notifications for user ${user.user_id}:`, userErr);
        }
      }
    });
  } catch (error) {
    console.error('Error sending status change notifications:', error);
  }
}

/**
 * Stop the UPS status checker
 */
function stopUpsStatusChecker() {
  console.log('Stopping UPS status checker...');
  
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
  
  console.log('UPS status checker stopped.');
}

module.exports = {
  initUpsStatusChecker,
  checkUpsStatus,
  stopUpsStatusChecker
};
