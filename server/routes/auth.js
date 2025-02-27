const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

// Check if setup is required
router.get('/check-setup', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json({ isFirstTimeSetup: row.count === 0 });
  });
});

// First-time setup
router.post('/setup', async (req, res) => {
  console.log('Setup request received:', {
    body: { ...req.body, password: req.body.password ? '********' : undefined }
  });
  
  const { username, password, nutServer = '10.40.0.116', nutPort } = req.body;
  
  if (!username || !password) {
    console.log('Setup validation failed: Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Check if any users exist
    const userCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Database error during setup check:', err.message);
          reject(err);
          return;
        }
        resolve(row.count);
      });
    });
    
    console.log('Current user count:', userCount);
    
    if (userCount > 0) {
      console.log('Setup rejected: Setup has already been completed');
      return res.status(400).json({ message: 'Setup has already been completed' });
    }
    
    // Hash password
    const hashedPassword = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Password hashing error:', err.message);
          reject(err);
          return;
        }
        resolve(hash);
      });
    });
    
    console.log('Password hashed successfully');
    
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    
    console.log('Database transaction started');
    
    try {
      // Create admin user
      const userId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [username, hashedPassword, 'admin'],
          function(err) {
            if (err) {
              console.error('Error creating user:', err.message);
              reject(err);
              return;
            }
            resolve(this.lastID);
          }
        );
      });
      
      console.log('Admin user created with ID:', userId);
      
      // Add NUT server
      const nutServerId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO nut_servers (host, port) VALUES (?, ?)',
          [nutServer, nutPort || 3493],
          function(err) {
            if (err) {
              console.error('Error adding NUT server:', err.message);
              reject(err);
              return;
            }
            resolve(this.lastID);
          }
        );
      });
      
      console.log('NUT server added with ID:', nutServerId);
      
      // Try to discover and register UPS systems
      let upsList = [];
      let upsSystemsAdded = [];
      
      try {
        // Import the NUT client utility
        const { getUpsListFromNutServer } = require('../utils/nutClient');
        
        // Connect to the NUT server and get UPS list
        upsList = await getUpsListFromNutServer(nutServer, nutPort || 3493);
        console.log(`Discovered ${upsList.length} UPS systems on NUT server ${nutServer}:${nutPort || 3493}`);
        
        // Register each UPS system in the database
        if (upsList && upsList.length > 0) {
          for (const upsName of upsList) {
            try {
              // Add the UPS system to the database
              const upsId = await new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
                  [upsName, nutServerId, upsName],
                  function(err) {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve(this.lastID);
                  }
                );
              });
              
              console.log(`Registered UPS ${upsName} with ID ${upsId}`);
              
              upsSystemsAdded.push({
                id: upsId,
                name: upsName,
                upsName: upsName,
                nutServerId: nutServerId
              });
            } catch (upsErr) {
              console.error(`Error registering UPS ${upsName}:`, upsErr.message);
              // Continue with other UPS systems even if one fails
            }
          }
        }
      } catch (discoveryErr) {
        console.error(`Error discovering UPS systems for server ${nutServer}:${nutPort || 3493}:`, discoveryErr.message);
        // Continue even if discovery fails, as the UPS monitoring system will try again later
      }
      
      // Commit the transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      
      console.log('Database transaction committed');
      
      // Generate JWT token
      const token = jwt.sign({ id: userId, username, role: 'admin' }, getJwtSecret(), { expiresIn: '24h' });
      console.log('JWT token generated');
      
      const responseData = {
        message: 'Setup completed successfully',
        user: { id: userId, username, role: 'admin' },
        token,
        nutServer: {
          id: nutServerId,
          host: nutServer,
          port: nutPort || 3493
        },
        upsSystemsDiscovered: upsList.length,
        upsSystemsAdded: upsSystemsAdded
      };
      
      console.log('Setup completed successfully, sending response');
      return res.status(201).json(responseData);
    } catch (transactionError) {
      // Rollback the transaction if any error occurs
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => {
          resolve();
        });
      });
      
      console.error('Transaction error:', transactionError.message);
      return res.status(500).json({ message: 'Setup failed', error: transactionError.message });
    }
  } catch (error) {
    console.error('Setup error:', error.message);
    return res.status(500).json({ message: 'Setup failed', error: error.message });
  }
});

// Login
router.post('/login', (req, res) => {
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
        getJwtSecret(),
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
router.post('/register', authenticateToken, (req, res) => {
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

module.exports = router;
