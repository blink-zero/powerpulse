const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getUpsListFromNutServer } = require('../utils/nutClient');

const router = express.Router();

// Get all NUT servers
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT id, host, port, username, updated_at FROM nut_servers', (err, servers) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json(servers || []);
  });
});

// Get a specific NUT server
router.get('/:id', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.put('/:id', authenticateToken, (req, res) => {
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
router.delete('/:id', authenticateToken, (req, res) => {
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

// Test NUT server connection
router.post('/:id/test', authenticateToken, async (req, res) => {
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
router.get('/config', authenticateToken, (req, res) => {
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
router.put('/config', authenticateToken, (req, res) => {
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

module.exports = router;
