const db = require('../db');
const NUT = require('node-nut');
const { sendDiscordNotification } = require('./discordWebhook');
const { sendSlackNotification } = require('./slackWebhook');
const { sendEmailNotification } = require('./emailNotification');
const { getNutUpsData } = require('./nutClient');

/**
 * UPS Monitoring Service
 * 
 * A consolidated service that handles UPS monitoring, status tracking,
 * and notifications. This service combines functionality previously
 * spread across multiple files (upsMonitor.js and upsStatusChecker.js)
 * into a single, cohesive module.
 */

// Store active NUT client connections
const nutClients = new Map();

// Store previous UPS states (in-memory cache)
const previousUpsStates = new Map();

// Store check intervals for cleanup
const checkIntervals = new Map();

// Store last check time for each UPS to avoid overwhelming the NUT server
const lastCheckTimes = new Map();

// Check interval in milliseconds (default: 60 seconds)
const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

// Timer reference for polling-based checks
let pollingCheckTimer = null;

// Maximum retries for notification sending
const MAX_NOTIFICATION_RETRIES = 3;

/**
 * Store UPS status in database and memory
 * @param {string} upsId - UPS system ID
 * @param {string} status - UPS status
 * @returns {Promise<void>}
 */
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

/**
 * Load UPS status from database, fallback to memory
 * @param {string} upsId - UPS system ID
 * @returns {Promise<string|null>} - UPS status or null if not found
 */
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

/**
 * Create the ups_status table if it doesn't exist
 * @returns {Promise<void>}
 */
async function ensureUpsStatusTable() {
  return new Promise((resolve, reject) => {
    // First, check if we can write to the database
    db.run('CREATE TABLE IF NOT EXISTS write_test (id INTEGER PRIMARY KEY)', function(err) {
      if (err) {
        console.error(`Error creating write test table: ${err.message}`);
        console.log('Using in-memory storage for UPS status (database is read-only)');
        resolve();
        return;
      }
      
      // If we can write to the database, drop the test table
      db.run('DROP TABLE write_test', function(err) {
        if (err) {
          console.error(`Error dropping write test table: ${err.message}`);
        }
        
        // Create the ups_status table
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
    });
  });
}

/**
 * Initialize UPS monitoring
 * @returns {Promise<void>}
 */
async function initUpsMonitoring() {
  console.log('Initializing UPS monitoring system...');
  
  try {
    // Ensure the ups_status table exists
    await ensureUpsStatusTable();
    
    // Get all NUT servers
    const servers = await getNutServers();
    
    // Connect to each NUT server
    for (const server of servers) {
      await connectToNutServer(server);
    }
    
    // Load previous UPS states from database
    await loadAllUpsStates();
    
    // Start polling-based checks as a fallback
    startPollingChecks();
    
    console.log('UPS monitoring system initialized successfully');
  } catch (error) {
    console.error('Error initializing UPS monitoring system:', error);
  }
}

/**
 * Start polling-based UPS status checks
 */
function startPollingChecks() {
  console.log(`Starting polling-based UPS status checks (interval: ${DEFAULT_CHECK_INTERVAL_MS / 1000} seconds)`);
  
  // Clear any existing timer
  if (pollingCheckTimer) {
    clearInterval(pollingCheckTimer);
  }
  
  // Start with an immediate check
  checkAllUpsStatus();
  
  // Set up regular interval checks
  pollingCheckTimer = setInterval(checkAllUpsStatus, DEFAULT_CHECK_INTERVAL_MS);
}

/**
 * Get all NUT servers from database
 * @returns {Promise<Array>} - Array of NUT server objects
 */
async function getNutServers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, host, port, username, password FROM nut_servers', (err, servers) => {
      if (err) {
        console.error('Error fetching NUT servers:', err.message);
        reject(err);
      } else {
        resolve(servers || []);
      }
    });
  });
}

/**
 * Get all UPS systems from database
 * @returns {Promise<Array>} - Array of UPS system objects
 */
async function getUpsSystems() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM ups_systems', (err, systems) => {
      if (err) {
        console.error('Error fetching UPS systems:', err.message);
        reject(err);
      } else {
        resolve(systems || []);
      }
    });
  });
}

/**
 * Load all UPS states from database
 * @returns {Promise<void>}
 */
async function loadAllUpsStates() {
  try {
    const upsSystems = await getUpsSystems();
    
    for (const ups of upsSystems) {
      const status = await loadUpsStatus(ups.id);
      if (status) {
        previousUpsStates.set(ups.id, { status });
        console.log(`Loaded previous status for UPS ${ups.id}: ${status}`);
      }
    }
  } catch (error) {
    console.error('Error loading UPS states:', error);
  }
}

/**
 * Connect to a NUT server
 * @param {Object} server - NUT server object
 * @returns {Promise<Object>} - NUT client object
 */
async function connectToNutServer(server) {
  const serverKey = `${server.host}:${server.port}`;
  const serverIdKey = `${server.id}`;
  
  // Close existing connection if any
  if (nutClients.has(serverKey)) {
    try {
      const existingClient = nutClients.get(serverKey);
      existingClient.end();
      nutClients.delete(serverKey);
      console.log(`Closed existing connection to NUT server ${serverKey}`);
    } catch (error) {
      console.error(`Error closing existing connection to NUT server ${serverKey}:`, error);
    }
  }
  
  // Also check for server ID key
  if (nutClients.has(serverIdKey)) {
    try {
      const existingClient = nutClients.get(serverIdKey);
      existingClient.end();
      nutClients.delete(serverIdKey);
      console.log(`Closed existing connection to NUT server ID ${serverIdKey}`);
    } catch (error) {
      console.error(`Error closing existing connection to NUT server ID ${serverIdKey}:`, error);
    }
  }
  
  return new Promise((resolve, reject) => {
    try {
      console.log(`Connecting to NUT server ${server.host}:${server.port} (ID: ${server.id})...`);
      
      const client = new NUT(server.port || 3493, server.host, server.username, server.password);
      
      // Set up event handlers
      client.on('error', (err) => {
        console.error(`NUT client error for ${serverKey} (ID: ${server.id}):`, err);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          console.log(`Attempting to reconnect to NUT server ${serverKey} (ID: ${server.id})...`);
          connectToNutServer(server).catch(console.error);
        }, 10000); // 10 seconds
      });
      
      client.on('close', () => {
        console.log(`NUT client disconnected from ${serverKey} (ID: ${server.id})`);
        nutClients.delete(serverKey);
        nutClients.delete(serverIdKey);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          console.log(`Attempting to reconnect to NUT server ${serverKey} (ID: ${server.id})...`);
          connectToNutServer(server).catch(console.error);
        }, 10000); // 10 seconds
      });
      
      client.on('ready', async () => {
        console.log(`NUT client connected to ${serverKey} (ID: ${server.id})`);
        // Store the client with both the server key and the server ID key
        nutClients.set(serverKey, client);
        nutClients.set(serverIdKey, client);
        
        try {
          // Get list of UPS devices
          const upsList = await getUpsListFromClient(client);
          console.log(`Found ${upsList.length} UPS devices on server ${serverKey}`);
          
          // Set up monitoring for each UPS
          for (const upsName of upsList) {
            monitorUps(client, server.id, upsName);
          }
          
          resolve(client);
        } catch (error) {
          console.error(`Error setting up UPS monitoring for server ${serverKey}:`, error);
          reject(error);
        }
      });
      
      // Start the connection
      client.start();
    } catch (error) {
      console.error(`Error connecting to NUT server ${serverKey}:`, error);
      reject(error);
    }
  });
}

/**
 * Get list of UPS devices from a NUT client
 * @param {Object} client - NUT client object
 * @returns {Promise<Array>} - Array of UPS names
 */
function getUpsListFromClient(client) {
  return new Promise((resolve, reject) => {
    client.GetUPSList((upslist, error) => {
      if (error) {
        reject(new Error(`Failed to get UPS list: ${error}`));
        return;
      }
      
      const upsList = Object.keys(upslist);
      resolve(upsList);
    });
  });
}

/**
 * Monitor a specific UPS
 * @param {Object} client - NUT client object
 * @param {string} serverId - NUT server ID
 * @param {string} upsName - UPS name
 */
function monitorUps(client, serverId, upsName) {
  console.log(`Setting up monitoring for UPS ${upsName} on server ${serverId}`);
  
  // Add a random delay to stagger the checks and avoid overwhelming the NUT server
  const randomDelay = Math.floor(Math.random() * 2000); // Random delay between 0-2000ms
  
  // Set up a timer to check UPS status every 10 seconds
  const checkInterval = setInterval(async () => {
    try {
      const key = `${serverId}:${upsName}`;
      const now = Date.now();
      const lastCheck = lastCheckTimes.get(key) || 0;
      
      // Ensure at least 3 seconds between checks for the same UPS
      if (now - lastCheck >= 3000) {
        lastCheckTimes.set(key, now);
        await checkUpsStatus(client, serverId, upsName);
      }
    } catch (error) {
      console.error(`Error checking status for UPS ${upsName}:`, error);
    }
  }, 10000 + randomDelay); // Check every 10 seconds + random delay
  
  // Store the interval reference for cleanup
  const key = `${serverId}:${upsName}`;
  if (checkIntervals.has(key)) {
    clearInterval(checkIntervals.get(key));
  }
  checkIntervals.set(key, checkInterval);
}

/**
 * Check UPS status and send notifications if changed
 * @param {Object} client - NUT client object
 * @param {string} serverId - NUT server ID
 * @param {string} upsName - UPS name
 * @returns {Promise<void>}
 */
async function checkUpsStatus(client, serverId, upsName) {
  try {
    // Get UPS variables
    const variables = await getUpsVariables(client, upsName);
    
    // Get status
    const status = variables['ups.status'] || 'Unknown';
    
    // Translate status code to human-readable format
    let statusDisplay = status;
    
    // Common NUT status codes
    if (status.includes('OL')) {
      statusDisplay = 'Online';
    } else if (status.includes('OB')) {
      statusDisplay = 'On Battery';
    } else if (status.includes('LB')) {
      statusDisplay = 'Low Battery';
    } else if (status.includes('RB')) {
      statusDisplay = 'Replace Battery';
    }
    
    // Find UPS in database
    let upsSystem = await findUpsInDatabase(serverId, upsName);
    
    // If UPS not found in database, try to register it
    if (!upsSystem) {
      console.log(`UPS ${upsName} on server ${serverId} not found in database, attempting to register it`);
      
      try {
        // Try to register the UPS in the database
        upsSystem = await registerUpsInDatabase(serverId, upsName);
        console.log(`Successfully registered UPS ${upsName} on server ${serverId} with ID ${upsSystem.id}`);
      } catch (regError) {
        console.error(`Failed to register UPS ${upsName} in database: ${regError.message}`);
        console.log(`Falling back to in-memory representation`);
        
        // Create a virtual UPS system with a unique ID
        const virtualId = `virtual-${serverId}-${upsName}`;
        upsSystem = {
          id: virtualId,
          name: upsName,
          ups_name: upsName,
          nut_server_id: serverId,
          virtual: true // Mark as virtual so we know it's not in the database
        };
        
        console.log(`Created in-memory UPS ${upsName} on server ${serverId} with ID ${virtualId}`);
      }
    }
    
    // Get previous state
    const prevState = previousUpsStates.get(upsSystem.id);
    
    // Skip if no previous state (first check)
    if (!prevState) {
      console.log(`First check for UPS ${upsSystem.name} (${upsSystem.id}). Status: ${statusDisplay}`);
      previousUpsStates.set(upsSystem.id, { status: statusDisplay });
      await storeUpsStatus(upsSystem.id, statusDisplay);
      return;
    }
    
    // Check for status changes
    if (prevState.status !== statusDisplay) {
      console.log(`UPS ${upsSystem.name} (${upsSystem.id}) status changed from "${prevState.status}" to "${statusDisplay}"`);
      
      // Send notifications
      await sendStatusChangeNotifications(upsSystem, statusDisplay, prevState.status);
      
      // Update previous state
      previousUpsStates.set(upsSystem.id, { status: statusDisplay });
      await storeUpsStatus(upsSystem.id, statusDisplay);
    }
  } catch (error) {
    console.error(`Error checking status for UPS ${upsName}:`, error);
  }
}

/**
 * Check the status of all UPS systems using polling
 * This is a fallback method that uses the NUT client utility
 * instead of direct connections
 */
async function checkAllUpsStatus() {
  console.log('Checking all UPS status via polling...');
  
  try {
    // Get all NUT servers
    const servers = await getNutServers();
    
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
    const dbSystems = await getUpsSystems();
    
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
        
        // Send notifications
        await sendStatusChangeNotifications(dbSystem, liveUps.status, previousStatus);
        
        // Store new status in database
        await storeUpsStatus(dbSystem.id, liveUps.status);
      }
      
      // Update in-memory state
      previousUpsStates.set(dbSystem.id, {
        status: liveUps.status,
        batteryCharge: liveUps.batteryCharge
      });
    }
  } catch (error) {
    console.error('Error checking UPS status:', error);
  }
}

/**
 * Find UPS in database
 * @param {string} serverId - NUT server ID
 * @param {string} upsName - UPS name
 * @returns {Promise<Object|null>} - UPS system object or null if not found
 */
async function findUpsInDatabase(serverId, upsName) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM ups_systems WHERE nut_server_id = ? AND ups_name = ?',
      [serverId, upsName],
      (err, ups) => {
        if (err) {
          console.error(`Error finding UPS in database: ${err.message}`);
          reject(err);
        } else {
          resolve(ups);
        }
      }
    );
  });
}

/**
 * Get UPS variables
 * @param {Object} client - NUT client object
 * @param {string} upsName - UPS name
 * @returns {Promise<Object>} - UPS variables
 */
function getUpsVariables(client, upsName) {
  return new Promise((resolve, reject) => {
    client.GetUPSVars(upsName, (variables, error) => {
      if (error) {
        reject(new Error(`Failed to get UPS variables: ${error}`));
        return;
      }
      
      resolve(variables);
    });
  });
}

/**
 * Send notifications for status change
 * @param {Object} upsSystem - UPS system object
 * @param {string} newStatus - New UPS status
 * @param {string} oldStatus - Old UPS status
 * @returns {Promise<void>}
 */
async function sendStatusChangeNotifications(upsSystem, newStatus, oldStatus) {
  try {
    // Get all users with notifications enabled
    const users = await getUsersWithNotificationsEnabled();
    
    if (!users || users.length === 0) {
      console.log('No users with notifications enabled. Skipping notifications.');
      return;
    }
    
    console.log(`Sending status change notifications to ${users.length} users...`);
    
    // For each user, check notification settings and send notifications
    for (const user of users) {
      try {
        // Get user's notification settings
        const settings = await getUserNotificationSettings(user.user_id);
        
        if (!settings) {
          console.log(`No notification settings found for user ${user.user_id}`);
          continue;
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
          continue;
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
        
        // Send notifications to all configured channels with retry logic
        await sendNotificationsWithRetry(user.user_id, settings, upsSystem, title, description, color, newStatus, oldStatus);
      } catch (userErr) {
        console.error(`Error processing notifications for user ${user.user_id}:`, userErr);
      }
    }
  } catch (error) {
    console.error('Error sending status change notifications:', error);
  }
}

/**
 * Get all users with notifications enabled
 * @returns {Promise<Array>} - Array of user objects
 */
function getUsersWithNotificationsEnabled() {
  return new Promise((resolve, reject) => {
    db.all('SELECT user_id FROM user_settings WHERE notifications_enabled = 1', (err, users) => {
      if (err) {
        console.error('Error fetching users with notifications enabled:', err);
        reject(err);
      } else {
        resolve(users || []);
      }
    });
  });
}

/**
 * Get user notification settings
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User notification settings or null if not found
 */
function getUserNotificationSettings(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId], (err, settings) => {
      if (err) {
        console.error(`Error fetching notification settings for user ${userId}:`, err);
        reject(err);
      } else {
        resolve(settings);
      }
    });
  });
}

/**
 * Send notifications with retry logic
 * @param {string} userId - User ID
 * @param {Object} settings - User notification settings
 * @param {Object} upsSystem - UPS system object
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} color - Notification color
 * @param {string} newStatus - New UPS status
 * @param {string} oldStatus - Old UPS status
 * @returns {Promise<Object>} - Notification results
 */
async function sendNotificationsWithRetry(userId, settings, upsSystem, title, description, color, newStatus, oldStatus) {
  const results = {
    discord: null,
    slack: null,
    email: null
  };
  
  // Discord notification with retry
  if (settings.discord_webhook_url) {
    let retries = 0;
    let success = false;
    
    while (retries < MAX_NOTIFICATION_RETRIES && !success) {
      try {
        console.log(`Sending Discord notification to user ${userId} (attempt ${retries + 1}/${MAX_NOTIFICATION_RETRIES})`);
        await sendDiscordNotification(settings.discord_webhook_url, { title, description, color });
        console.log(`✅ Discord notification sent successfully to user ${userId}`);
        results.discord = { success: true };
        success = true;
      } catch (err) {
        retries++;
        console.error(`❌ Error sending Discord notification to user ${userId} (attempt ${retries}/${MAX_NOTIFICATION_RETRIES}):`, err);
        
        if (retries < MAX_NOTIFICATION_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          results.discord = { success: false, error: err.message };
        }
      }
    }
  }
  
  // Slack notification with retry
  if (settings.slack_webhook_url) {
    let retries = 0;
    let success = false;
    
    while (retries < MAX_NOTIFICATION_RETRIES && !success) {
      try {
        console.log(`Sending Slack notification to user ${userId} (attempt ${retries + 1}/${MAX_NOTIFICATION_RETRIES})`);
        await sendSlackNotification(settings.slack_webhook_url, { title, description, color });
        console.log(`✅ Slack notification sent successfully to user ${userId}`);
        results.slack = { success: true };
        success = true;
      } catch (err) {
        retries++;
        console.error(`❌ Error sending Slack notification to user ${userId} (attempt ${retries}/${MAX_NOTIFICATION_RETRIES}):`, err);
        
        if (retries < MAX_NOTIFICATION_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          results.slack = { success: false, error: err.message };
        }
      }
    }
  }
  
  // Email notification with retry
  if (settings.email_notifications === 1 && settings.email_recipients) {
    let retries = 0;
    let success = false;
    
    while (retries < MAX_NOTIFICATION_RETRIES && !success) {
      try {
        console.log(`Sending email notification to user ${userId} (attempt ${retries + 1}/${MAX_NOTIFICATION_RETRIES})`);
        await sendEmailNotification(settings.email_recipients, { 
          title, 
          description: description.replace(/\*\*/g, '') // Remove Discord markdown
        });
        console.log(`✅ Email notification sent successfully to user ${userId}`);
        results.email = { success: true };
        success = true;
      } catch (err) {
        retries++;
        console.error(`❌ Error sending email notification to user ${userId} (attempt ${retries}/${MAX_NOTIFICATION_RETRIES}):`, err);
        
        if (retries < MAX_NOTIFICATION_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          results.email = { success: false, error: err.message };
        }
      }
    }
  }
  
  // Log the notification
  try {
    await logNotification(userId, upsSystem.id, upsSystem.name, newStatus, oldStatus);
  } catch (err) {
    console.error('Error logging notification:', err);
  }
  
  return results;
}

/**
 * Log notification to database
 * @param {string} userId - User ID
 * @param {string} upsId - UPS system ID
 * @param {string} upsName - UPS name
 * @param {string} status - UPS status
 * @param {string} previousStatus - Previous UPS status
 * @returns {Promise<number>} - Notification log ID
 */
function logNotification(userId, upsId, upsName, status, previousStatus) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notification_logs 
       (user_id, ups_id, ups_name, status, previous_status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, upsId, upsName, status, previousStatus],
      function(err) {
        if (err) {
          console.error('Error logging notification:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

/**
 * Register a new UPS system in the database
 * @param {string} serverId - NUT server ID
 * @param {string} upsName - UPS name
 * @returns {Promise<Object>} - UPS system object
 */
async function registerUpsInDatabase(serverId, upsName) {
  return new Promise((resolve, reject) => {
    // First check if this UPS system already exists in the database
    db.get(
      'SELECT * FROM ups_systems WHERE nut_server_id = ? AND ups_name = ?',
      [serverId, upsName],
      (err, existingUps) => {
        if (err) {
          console.error(`Error checking for existing UPS ${upsName} in database:`, err.message);
          reject(err);
          return;
        }
        
        // If the UPS already exists, return it
        if (existingUps) {
          console.log(`UPS ${upsName} already exists in database with ID ${existingUps.id}`);
          resolve(existingUps);
          return;
        }
        
        // Find the NUT client for this server ID
        let client = null;
        
        // Look for the client with the matching server ID
        for (const [key, nutClient] of nutClients.entries()) {
          if (key.includes(`${serverId}:`) || key === `${serverId}`) {
            client = nutClient;
            break;
          }
        }
        
        // If we couldn't find a specific client, try to use any active client
        if (!client) {
          console.log(`No specific NUT client found for server ID ${serverId}, trying to use any active client`);
          const clients = Array.from(nutClients.values());
          if (clients.length > 0) {
            client = clients[0];
          }
        }
        
        // If we still don't have a client, try to create a new connection
        if (!client) {
          console.log(`No active NUT client available for server ID ${serverId}, will register UPS with basic info`);
          
          // Insert the new UPS system into the database with basic info
          db.run(
            'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
            [upsName, serverId, upsName],
            function(err) {
              if (err) {
                console.error(`Error registering UPS ${upsName} in database:`, err.message);
                reject(err);
                return;
              }
              
              console.log(`Successfully registered UPS ${upsName} in database with ID ${this.lastID} (basic info)`);
              
              // Get the newly created UPS system
              db.get('SELECT * FROM ups_systems WHERE id = ?', [this.lastID], (err, ups) => {
                if (err) {
                  console.error(`Error fetching newly created UPS system:`, err.message);
                  reject(err);
                  return;
                }
                
                resolve(ups);
              });
            }
          );
          return;
        }
        
        console.log(`Using NUT client to register UPS ${upsName} for server ID ${serverId}`);
        
        client.GetUPSVars(upsName, (variables, error) => {
          if (error) {
            console.error(`Error getting UPS variables for ${upsName}:`, error);
            // Continue with registration even if we can't get variables
          }
          
          // Use UPS ID as display name if available, otherwise use UPS name
          const displayName = variables && variables['ups.id'] ? variables['ups.id'] : upsName;
          
          console.log(`Registering UPS ${upsName} with display name ${displayName} for server ID ${serverId}`);
          
          // Insert the new UPS system into the database
          db.run(
            'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
            [displayName, serverId, upsName],
            function(err) {
              if (err) {
                console.error(`Error registering UPS ${upsName} in database:`, err.message);
                
                // If we get a constraint error, it might be because the UPS was added in parallel
                // Try to fetch it again
                if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT')) {
                  db.get(
                    'SELECT * FROM ups_systems WHERE nut_server_id = ? AND ups_name = ?',
                    [serverId, upsName],
                    (err, existingUps) => {
                      if (err || !existingUps) {
                        reject(err || new Error(`Failed to find UPS after constraint error`));
                        return;
                      }
                      
                      console.log(`Found existing UPS ${upsName} in database with ID ${existingUps.id} after constraint error`);
                      resolve(existingUps);
                    }
                  );
                  return;
                }
                
                reject(err);
                return;
              }
              
              console.log(`Successfully registered UPS ${upsName} in database with ID ${this.lastID}`);
              
              // Get the newly created UPS system
              db.get('SELECT * FROM ups_systems WHERE id = ?', [this.lastID], (err, ups) => {
                if (err) {
                  console.error(`Error fetching newly created UPS system:`, err.message);
                  reject(err);
                  return;
                }
                
                resolve(ups);
              });
            }
          );
        });
      }
    );
  });
}

/**
 * Get UPS system by ID
 * @param {string} upsId - UPS system ID
 * @returns {Promise<Object|null>} - UPS system object or null if not found
 */
function getUpsSystem(upsId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
      if (err) {
        console.error(`Error fetching UPS system: ${err.message}`);
        reject(err);
      } else {
        resolve(ups);
      }
    });
  });
}

/**
 * Stop UPS monitoring
 */
function stopUpsMonitoring() {
  console.log('Stopping UPS monitoring...');
  
  // Clear all check intervals
  for (const [key, interval] of checkIntervals.entries()) {
    clearInterval(interval);
    console.log(`Cleared check interval for ${key}`);
  }
  checkIntervals.clear();
  
  // Clear polling check timer
  if (pollingCheckTimer) {
    clearInterval(pollingCheckTimer);
    pollingCheckTimer = null;
    console.log('Cleared polling check timer');
  }
  
  // Close all NUT client connections
  for (const [key, client] of nutClients.entries()) {
    try {
      client.end();
      console.log(`Closed connection to NUT server ${key}`);
    } catch (error) {
      console.error(`Error closing connection to NUT server ${key}:`, error);
    }
  }
  nutClients.clear();
  
  console.log('UPS monitoring stopped');
}

/**
 * Force a notification test
 * @param {string} upsId - UPS system ID
 * @param {string} newStatus - New UPS status
 * @param {string} oldStatus - Old UPS status
 * @returns {Promise<Object>} - Test result
 */
async function forceNotificationTest(upsId, newStatus, oldStatus) {
  try {
    let upsSystem;
    
    // Check if this is a virtual UPS ID
    if (typeof upsId === 'string' && upsId.startsWith('virtual-')) {
      // Parse the virtual ID to get server ID and UPS name
      const parts = upsId.split('-');
      if (parts.length >= 3) {
        const serverId = parts[1];
        const upsName = parts.slice(2).join('-');
        
        // Create a virtual UPS system
        upsSystem = {
          id: upsId,
          name: upsName,
          ups_name: upsName,
          nut_server_id: serverId,
          virtual: true
        };
      }
    } else {
      // Try to get UPS system from database
      upsSystem = await getUpsSystem(upsId);
    }
    
    if (!upsSystem) {
      throw new Error(`UPS system with ID ${upsId} not found`);
    }
    
    // Send notifications
    await sendStatusChangeNotifications(upsSystem, newStatus, oldStatus);
    
    return { success: true, message: 'Notification test sent successfully' };
  } catch (error) {
    console.error('Error forcing notification test:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initUpsMonitoring,
  stopUpsMonitoring,
  forceNotificationTest,
  checkAllUpsStatus
};
