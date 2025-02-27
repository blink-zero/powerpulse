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
router.post('/setup', (req, res) => {
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
                const token = jwt.sign({ id: userId, username, role: 'admin' }, getJwtSecret(), { expiresIn: '24h' });
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
