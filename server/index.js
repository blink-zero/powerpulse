const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const NUT = require('node-nut');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'powerpulse-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
// Use data directory for Docker volume if it exists, otherwise use the current directory
const dataDir = fs.existsSync(path.resolve(__dirname, 'data')) ? path.resolve(__dirname, 'data') : __dirname;
const dbPath = path.resolve(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // NUT Server configuration
    db.run(`
      CREATE TABLE IF NOT EXISTS nut_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 3493,
        username TEXT,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // UPS Systems
    db.run(`
      CREATE TABLE IF NOT EXISTS ups_systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        nut_server_id INTEGER,
        ups_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nut_server_id) REFERENCES nut_servers (id)
      )
    `);

    // Battery History
    db.run(`
      CREATE TABLE IF NOT EXISTS battery_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ups_id INTEGER NOT NULL,
        charge_percent REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ups_id) REFERENCES ups_systems (id)
      )
    `);
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check if setup is required
app.get('/api/auth/check-setup', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json({ isFirstTimeSetup: row.count === 0 });
  });
});

// First-time setup
app.post('/api/auth/setup', (req, res) => {
  console.log('Setup request received:', {
    body: { ...req.body, password: req.body.password ? '********' : undefined }
  });
  
  const { username, password, nutServer = '10.40.0.116', nutPort } = req.body;
  
  if (!username || !password) {
    console.log('Setup validation failed: Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check if any users exist
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Database error during setup check:', err.message);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    console.log('Current user count:', row.count);
    
    if (row.count > 0) {
      console.log('Setup rejected: Setup has already been completed');
      return res.status(400).json({ message: 'Setup has already been completed' });
    }
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Password hashing error:', err.message);
        return res.status(500).json({ message: 'Password hashing error', error: err.message });
      }
      
      console.log('Password hashed successfully');
      
      // Begin transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        console.log('Database transaction started');
        
        // Create admin user
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [username, hashedPassword, 'admin'],
          function(err) {
            if (err) {
              console.error('Error creating user:', err.message);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error creating user', error: err.message });
            }
            
            const userId = this.lastID;
            console.log('Admin user created with ID:', userId);
            
            // Add NUT server
            db.run(
              'INSERT INTO nut_servers (host, port) VALUES (?, ?)',
              [nutServer, nutPort || 3493],
              function(err) {
                if (err) {
                  console.error('Error adding NUT server:', err.message);
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Error adding NUT server', error: err.message });
                }
                
                const nutServerId = this.lastID;
                console.log('NUT server added with ID:', nutServerId);
                
                db.run('COMMIT');
                console.log('Database transaction committed');
                
                // Generate JWT token
                const token = jwt.sign({ id: userId, username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
                console.log('JWT token generated');
                
                const responseData = {
                  message: 'Setup completed successfully',
                  user: { id: userId, username, role: 'admin' },
                  token
                };
                
                console.log('Setup completed successfully, sending response');
                return res.status(201).json(responseData);
              }
            );
          }
        );
      });
    });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error', error: err.message });
      }
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    });
  });
});

// Register new user (admin only)
app.post('/api/auth/register', authenticateToken, (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can create new users' });
  }
  
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Password hashing error', error: err.message });
    }
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email || null, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Username or email already exists' });
          }
          return res.status(500).json({ message: 'Error creating user', error: err.message });
        }
        
        const userId = this.lastID;
        
        return res.status(201).json({
          message: 'User created successfully',
          user: { id: userId, username, email, role: 'user' }
        });
      }
    );
  });
});

// Get all NUT servers
app.get('/api/nut/servers', authenticateToken, (req, res) => {
  db.all('SELECT id, host, port, username, updated_at FROM nut_servers', (err, servers) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json(servers || []);
  });
});

// Get a specific NUT server
app.get('/api/nut/servers/:id', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.id);
  
  db.get('SELECT id, host, port, username, updated_at FROM nut_servers WHERE id = ?', [serverId], (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'NUT server not found' });
    }
    
    return res.json(server);
  });
});

// Add a new NUT server
app.post('/api/nut/servers', authenticateToken, (req, res) => {
  const { host, port, username, password } = req.body;
  
  if (!host) {
    return res.status(400).json({ message: 'Server host is required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can add NUT servers' });
  }
  
  db.run(
    'INSERT INTO nut_servers (host, port, username, password) VALUES (?, ?, ?, ?)',
    [host, port || 3493, username || null, password || null],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating NUT server', error: err.message });
      }
      
      return res.status(201).json({
        message: 'NUT server created',
        id: this.lastID,
        host,
        port: port || 3493,
        username: username || null
      });
    }
  );
});

// Update a NUT server
app.put('/api/nut/servers/:id', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.id);
  const { host, port, username, password } = req.body;
  
  if (!host) {
    return res.status(400).json({ message: 'Server host is required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can update NUT servers' });
  }
  
  // Check if server exists
  db.get('SELECT id FROM nut_servers WHERE id = ?', [serverId], (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'NUT server not found' });
    }
    
    // Prepare update query based on whether password is provided
    let query, params;
    
    if (password) {
      query = 'UPDATE nut_servers SET host = ?, port = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params = [host, port || 3493, username || null, password, serverId];
    } else {
      query = 'UPDATE nut_servers SET host = ?, port = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params = [host, port || 3493, username || null, serverId];
    }
    
    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating NUT server', error: err.message });
      }
      
      return res.json({
        message: 'NUT server updated',
        id: serverId,
        host,
        port: port || 3493,
        username: username || null
      });
    });
  });
});

// Delete a NUT server
app.delete('/api/nut/servers/:id', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.id);
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can delete NUT servers' });
  }
  
  // Check if server exists
  db.get('SELECT id FROM nut_servers WHERE id = ?', [serverId], (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'NUT server not found' });
    }
    
    // Check if server is in use by any UPS systems
    db.get('SELECT COUNT(*) as count FROM ups_systems WHERE nut_server_id = ?', [serverId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ message: 'Cannot delete NUT server that is in use by UPS systems' });
      }
      
      // Delete the server
      db.run('DELETE FROM nut_servers WHERE id = ?', [serverId], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error deleting NUT server', error: err.message });
        }
        
        return res.json({ message: 'NUT server deleted' });
      });
    });
  });
});

// NUT client setup
// Cache for NUT connections
const nutConnections = new Map();

// Function to get a NUT client connection
async function getNutClient(host, port, username, password) {
  const key = `${host}:${port}`;
  
  // Check if we already have a connection
  if (nutConnections.has(key)) {
    return nutConnections.get(key);
  }
  
  // Create a new connection
  const client = new NUT(port, host, username, password);
  
  // Wrap the connection in a promise
  return new Promise((resolve, reject) => {
    client.on('error', (err) => {
      console.error(`NUT client error for ${host}:${port}:`, err);
      reject(err);
    });
    
    client.on('ready', () => {
      console.log(`NUT client connected to ${host}:${port}`);
      nutConnections.set(key, client);
      resolve(client);
    });
    
    client.on('close', () => {
      console.log(`NUT client disconnected from ${host}:${port}`);
      nutConnections.delete(key);
    });
    
    client.start();
  });
}

// Function to get the list of UPS devices from a NUT server
async function getUpsListFromNutServer(host, port, username, password) {
  try {
    const client = await getNutClient(host, port, username, password);
    
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
  } catch (error) {
    console.error(`Error getting UPS list from ${host}:${port}:`, error);
    throw error;
  }
}

// Function to get UPS variables from a NUT server
async function getUpsVariables(host, port, username, password, upsName) {
  try {
    const client = await getNutClient(host, port, username, password);
    
    // For UPS with "Other communication still running" error, we need to retry
    // with a delay to get the actual values
    const maxRetries = 3;
    let retryCount = 0;
    
    const getVariablesWithRetry = async () => {
      return new Promise((resolve, reject) => {
        client.GetUPSVars(upsName, (variables, error) => {
          if (error) {
            console.warn(`Warning getting UPS variables for ${upsName}: ${error}`);
            
            // Special case for "Other communication still running" error
            if (error.includes("Other communication still running") && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying (${retryCount}/${maxRetries}) to get variables for ${upsName}...`);
              
              // Wait a bit before retrying
              setTimeout(() => {
                getVariablesWithRetry().then(resolve).catch(reject);
              }, 500);
              return;
            }
            
            // For other errors or if max retries reached, resolve with an empty object
            resolve({});
            return;
          }
          
          // Check if we have essential variables
          if (!variables['ups.status']) {
            console.warn(`Warning: UPS ${upsName} is missing essential variables`);
            // Add a default status if missing
            variables['ups.status'] = 'OL';
          }
          
          resolve(variables);
        });
      });
    };
    
    return await getVariablesWithRetry();
  } catch (error) {
    console.error(`Error getting UPS variables for ${upsName} from ${host}:${port}:`, error);
    // Return empty object instead of throwing
    return {};
  }
}

// Function to connect to NUT server and get UPS data
async function getNutUpsData(host, port, username, password) {
  console.log(`Fetching UPS data from NUT server at ${host}:${port}`);
  
  try {
    // Get the list of UPS devices
    const upsList = await getUpsListFromNutServer(host, port, username, password);
    
    // Get data for each UPS
    const upsDataPromises = upsList.map(async (upsName, index) => {
      try {
        const variables = await getUpsVariables(host, port, username, password, upsName);
        
        // Extract relevant data from variables
        const model = variables['device.model'] || 'Unknown';
        const brand = variables['device.mfr'] || 'Unknown'; // Manufacturer/brand
        const serial = variables['device.serial'] || 'Unknown'; // Serial number
        const status = variables['ups.status'] || 'Unknown';
        
        // Battery data
        const batteryCharge = parseFloat(variables['battery.charge'] || '0');
        const batteryVoltage = parseFloat(variables['battery.voltage'] || '0');
        
        // Input/output data
        const inputVoltage = parseFloat(variables['input.voltage'] || '0');
        const outputVoltage = parseFloat(variables['output.voltage'] || '0');
        
        // Load and runtime
        const load = parseFloat(variables['ups.load'] || '0');
        const runtimeRemaining = parseFloat(variables['battery.runtime'] || '0') / 60; // Convert seconds to minutes
        
        // Check if we have any variables
        if (Object.keys(variables).length === 0) {
          return {
            id: index + 1,
            name: upsName,
            displayName: upsName,
            model: 'Unknown',
            brand: 'Unknown',
            serial: 'Unknown',
            status: 'Unknown', // Show actual status as Unknown
            batteryCharge: null, // Use null to indicate no data
            batteryVoltage: null,
            inputVoltage: null,
            outputVoltage: null,
            runtimeRemaining: null,
            load: null
          };
        }
        
        // Use the actual status from the UPS
        let statusDisplay = status;
        
        // Create UPS data object with actual values
        const upsData = {
          id: index + 1,
          name: upsName,
          displayName: variables['ups.id'] || upsName,
          model: model || 'Unknown',
          brand: brand || 'Unknown',
          serial: serial || 'Unknown',
          status: statusDisplay,
          batteryCharge: isNaN(batteryCharge) ? null : Math.round(batteryCharge),
          batteryVoltage: isNaN(batteryVoltage) ? null : parseFloat(batteryVoltage.toFixed(1)),
          inputVoltage: isNaN(inputVoltage) ? null : parseFloat(inputVoltage.toFixed(1)),
          outputVoltage: isNaN(outputVoltage) ? null : parseFloat(outputVoltage.toFixed(1)),
          runtimeRemaining: isNaN(runtimeRemaining) ? null : Math.round(runtimeRemaining),
          load: isNaN(load) ? null : Math.round(load)
        };
        
        // Only include temperature if available in the UPS data
        if (variables['ups.temperature']) {
          const temp = parseFloat(variables['ups.temperature']);
          if (!isNaN(temp)) {
            upsData.temperature = parseFloat(temp.toFixed(1));
          }
        }
        
        return upsData;
      } catch (error) {
        console.error(`Error getting data for UPS ${upsName}:`, error);
        
        // Return basic info with actual error status
        return {
          id: index + 1,
          name: upsName,
          displayName: upsName,
          model: 'Unknown',
          brand: 'Unknown',
          serial: 'Unknown',
          status: 'Error', // Show as Error
          batteryCharge: null,
          batteryVoltage: null,
          inputVoltage: null,
          outputVoltage: null,
          runtimeRemaining: null,
          load: null,
          error: error.message
        };
      }
    });
    
    const upsDataList = await Promise.all(upsDataPromises);
    return upsDataList;
  } catch (error) {
    console.error(`Error connecting to NUT server at ${host}:${port}:`, error);
    
    // Return empty array if there's an error
    return [];
  }
}

// Test NUT server connection
app.post('/api/nut/servers/:id/test', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  
  // Get server details
  db.get('SELECT host, port, username, password FROM nut_servers WHERE id = ?', [serverId], async (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'NUT server not found' });
    }
    
    try {
      // Connect to the NUT server and get UPS list
      const upsList = await getUpsListFromNutServer(server.host, server.port, server.username, server.password);
      
      return res.json({
        message: 'Connection successful',
        upsList: upsList
      });
    } catch (error) {
      return res.status(500).json({ message: 'Connection failed', error: error.message });
    }
  });
});

// Get NUT server configuration (legacy endpoint for backward compatibility)
app.get('/api/nut/config', authenticateToken, (req, res) => {
  db.get('SELECT id, host, port FROM nut_servers LIMIT 1', (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'No NUT server configured' });
    }
    
    return res.json(server);
  });
});

// Update NUT server configuration (legacy endpoint for backward compatibility)
app.put('/api/nut/config', authenticateToken, (req, res) => {
  const { host, port, username, password } = req.body;
  
  if (!host) {
    return res.status(400).json({ message: 'Server host is required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can update NUT server configuration' });
  }
  
  db.get('SELECT id FROM nut_servers LIMIT 1', (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      // Insert new configuration
      db.run(
        'INSERT INTO nut_servers (host, port, username, password) VALUES (?, ?, ?, ?)',
        [host, port || 3493, username || null, password || null],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating NUT server configuration', error: err.message });
          }
          
          return res.json({
            message: 'NUT server configuration created',
            id: this.lastID,
            host,
            port: port || 3493
          });
        }
      );
    } else {
      // Update existing configuration
      db.run(
        'UPDATE nut_servers SET host = ?, port = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [host, port || 3493, username || null, password || null, server.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error updating NUT server configuration', error: err.message });
          }
          
          return res.json({
            message: 'NUT server configuration updated',
            id: server.id,
            host,
            port: port || 3493
          });
        }
      );
    }
  });
});

// Get all UPS systems from database
app.get('/api/ups/systems', authenticateToken, async (req, res) => {
  try {
    // First check if we have any UPS systems in the database
    db.all('SELECT * FROM ups_systems', async (err, dbSystems) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      // Get all NUT servers from database
      db.all('SELECT id, host, port, username, password FROM nut_servers', async (err, servers) => {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (servers.length === 0) {
          return res.status(404).json({ message: 'No NUT servers configured' });
        }
        
        try {
          // Get UPS data from all NUT servers
          const allUpsData = [];
          
          // Process each server
          for (const server of servers) {
            try {
              const nutHost = server.host;
              const nutPort = server.port || 3493;
              const nutUsername = server.username;
              const nutPassword = server.password;
              
              console.log(`Connecting to NUT server at ${nutHost}:${nutPort}`);
              
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
          
          // If we have database systems, combine with live data
          if (dbSystems.length > 0) {
            const combinedData = dbSystems.map(dbSystem => {
              // Find matching UPS in live data
              const liveUps = allUpsData.find(ups => 
                ups.name === dbSystem.ups_name && 
                ups.nutServerId === dbSystem.nut_server_id
              );
              
              if (liveUps) {
                // Combine database and live data
                return {
                  id: dbSystem.id,
                  name: dbSystem.name,
                  displayName: liveUps.displayName || dbSystem.name,
                  upsName: dbSystem.ups_name,
                  nutServerId: dbSystem.nut_server_id,
                  model: liveUps.model,
                  status: liveUps.status,
                  batteryCharge: liveUps.batteryCharge,
                  batteryVoltage: liveUps.batteryVoltage,
                  inputVoltage: liveUps.inputVoltage,
                  outputVoltage: liveUps.outputVoltage,
                  runtimeRemaining: liveUps.runtimeRemaining,
                  load: liveUps.load,
                  temperature: liveUps.temperature
                };
              } else {
                // Return basic info if live data not available
                return {
                  id: dbSystem.id,
                  name: dbSystem.name,
                  upsName: dbSystem.ups_name,
                  nutServerId: dbSystem.nut_server_id,
                  status: 'Unknown',
                  batteryCharge: null,
                  runtimeRemaining: null,
                  load: null
                };
              }
            });
            
            return res.json(combinedData);
          } else if (allUpsData.length > 0) {
            // If no database systems but we have live data, return that
            return res.json(allUpsData);
          } else {
            // If no UPS systems are found, return empty array
            console.log('No UPS systems found');
            return res.json([]);
          }
        } catch (nutErr) {
          console.error('NUT server error:', nutErr);
          return res.status(500).json({ message: 'Error connecting to NUT servers', error: nutErr.message });
        }
      });
    });
  } catch (error) {
    console.error('Error in /api/ups/systems:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific UPS system
app.get('/api/ups/systems/:id', authenticateToken, async (req, res) => {
  const upsId = parseInt(req.params.id);
  
  try {
    // Get UPS system from database
    db.get('SELECT * FROM ups_systems WHERE id = ?', [upsId], async (err, dbSystem) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (!dbSystem) {
        return res.status(404).json({ message: 'UPS system not found' });
      }
      
      // Get NUT server details
      db.get('SELECT host, port, username, password FROM nut_servers WHERE id = ?', [dbSystem.nut_server_id], async (err, server) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (!server) {
          return res.status(404).json({ message: 'NUT server not found' });
        }
        
        try {
          // Get live data for this UPS
          const upsData = await getNutUpsData(server.host, server.port, server.username, server.password);
          const matchingUps = upsData.find(ups => ups.name === dbSystem.ups_name);
          
          if (!matchingUps) {
            // Return basic info if live data not available
            return res.json({
              id: dbSystem.id,
              name: dbSystem.name,
              upsName: dbSystem.ups_name,
              nutServerId: dbSystem.nut_server_id,
              status: 'Unknown',
              batteryCharge: null,
              runtimeRemaining: null,
              load: null
            });
          }
          
          // Combine database and live data
          return res.json({
            id: dbSystem.id,
            name: dbSystem.name,
            displayName: matchingUps.displayName || dbSystem.name,
            upsName: dbSystem.ups_name,
            nutServerId: dbSystem.nut_server_id,
            model: matchingUps.model,
            status: matchingUps.status,
            batteryCharge: matchingUps.batteryCharge,
            batteryVoltage: matchingUps.batteryVoltage,
            inputVoltage: matchingUps.inputVoltage,
            outputVoltage: matchingUps.outputVoltage,
            runtimeRemaining: matchingUps.runtimeRemaining,
            load: matchingUps.load,
            temperature: matchingUps.temperature
          });
        } catch (error) {
          console.error('Error getting UPS data:', error);
          
          // Return basic info if there's an error
          return res.json({
            id: dbSystem.id,
            name: dbSystem.name,
            upsName: dbSystem.ups_name,
            nutServerId: dbSystem.nut_server_id,
            status: 'Error',
            batteryCharge: null,
            runtimeRemaining: null,
            load: null,
            error: error.message
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in /api/ups/systems/:id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new UPS system
app.post('/api/ups/systems', authenticateToken, (req, res) => {
  const { name, displayName, nutServerId, upsName } = req.body;
  
  if (!name || !nutServerId || !upsName) {
    return res.status(400).json({ message: 'Name, NUT server ID, and UPS name are required' });
  }
  
  // Check if NUT server exists
  db.get('SELECT id FROM nut_servers WHERE id = ?', [nutServerId], (err, server) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!server) {
      return res.status(404).json({ message: 'NUT server not found' });
    }
    
    // Add UPS system to database
    db.run(
      'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
      [name, nutServerId, upsName],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating UPS system', error: err.message });
        }
        
        return res.status(201).json({
          message: 'UPS system created',
          id: this.lastID,
          name,
          nutServerId,
          upsName
        });
      }
    );
  });
});

// Update a UPS system
app.put('/api/ups/systems/:id', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const { name, nutServerId, upsName } = req.body;
  
  if (!name || !nutServerId || !upsName) {
    return res.status(400).json({ message: 'Name, NUT server ID, and UPS name are required' });
  }
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Check if NUT server exists
    db.get('SELECT id FROM nut_servers WHERE id = ?', [nutServerId], (err, server) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (!server) {
        return res.status(404).json({ message: 'NUT server not found' });
      }
      
      // Update UPS system
      db.run(
        'UPDATE ups_systems SET name = ?, nut_server_id = ?, ups_name = ? WHERE id = ?',
        [name, nutServerId, upsName, upsId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error updating UPS system', error: err.message });
          }
          
          return res.json({
            message: 'UPS system updated',
            id: upsId,
            name,
            nutServerId,
            upsName
          });
        }
      );
    });
  });
});

// Delete a UPS system
app.delete('/api/ups/systems/:id', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can delete UPS systems' });
  }
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Delete UPS system
    db.run('DELETE FROM ups_systems WHERE id = ?', [upsId], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error deleting UPS system', error: err.message });
      }
      
      // Delete battery history for this UPS
      db.run('DELETE FROM battery_history WHERE ups_id = ?', [upsId], function(err) {
        if (err) {
          console.error(`Error deleting battery history for UPS ${upsId}:`, err.message);
        }
        
        return res.json({ message: 'UPS system deleted' });
      });
    });
  });
});

// Record battery charge for a UPS system
app.post('/api/ups/systems/:id/battery', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const { chargePercent } = req.body;
  
  if (chargePercent === undefined || isNaN(parseFloat(chargePercent))) {
    return res.status(400).json({ message: 'Battery charge percentage is required' });
  }
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Record battery charge
    db.run(
      'INSERT INTO battery_history (ups_id, charge_percent) VALUES (?, ?)',
      [upsId, parseFloat(chargePercent)],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error recording battery charge', error: err.message });
        }
        
        return res.status(201).json({
          message: 'Battery charge recorded',
          id: this.lastID,
          upsId,
          chargePercent: parseFloat(chargePercent),
          timestamp: new Date().toISOString()
        });
      }
    );
  });
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can view all users' });
  }
  
  db.all('SELECT id, username, email, role, created_at FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json(users || []);
  });
});

// Get battery history for a UPS system
app.get('/api/ups/systems/:id/battery', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const days = parseInt(req.query.days) || 7; // Default to 7 days
  
  // For multi-day views, we need more records to get a good representation
  // For 1-day view, we can use fewer records
  const limit = days > 1 ? 300 : 100; // Use more records for multi-day views
  
  console.log(`Fetching battery history for UPS ${upsId} for the last ${days} days (limit: ${limit})`);
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Calculate the date for N days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const daysAgoStr = daysAgo.toISOString();
    
    console.log(`Filtering battery history from ${daysAgoStr} to now`);
    
    // Get battery history for this UPS for the last N days
    db.all(
      'SELECT * FROM battery_history WHERE ups_id = ? AND timestamp >= ? ORDER BY timestamp ASC LIMIT ?',
      [upsId, daysAgoStr, limit],
      (err, history) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        console.log(`Found ${history?.length || 0} battery history records in the last ${days} days`);
        
        if (history && history.length > 0) {
          // Log the date range of the returned data
          const oldestRecord = new Date(history[0].timestamp);
          const newestRecord = new Date(history[history.length - 1].timestamp);
          console.log(`Date range of returned data: ${oldestRecord.toISOString()} to ${newestRecord.toISOString()}`);
          
          // Calculate how many hours of data we have
          const hoursDiff = (newestRecord - oldestRecord) / (1000 * 60 * 60);
          console.log(`Data spans approximately ${hoursDiff.toFixed(1)} hours (${(hoursDiff / 24).toFixed(1)} days)`);
        }
        
        return res.json(history || []);
      }
    );
  });
});

// Serve static files from the client build directory in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../client/dist');
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
