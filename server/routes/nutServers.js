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
router.post('/', authenticateToken, async (req, res) => {
  const { host, port, username, password } = req.body;
  
  if (!host) {
    return res.status(400).json({ message: 'Server host is required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can add NUT servers' });
  }
  
  try {
    // Insert the NUT server into the database
    const serverId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO nut_servers (host, port, username, password) VALUES (?, ?, ?, ?)',
        [host, port || 3493, username || null, password || null],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
    
    // Try to discover and register UPS systems for this server
    let upsList = [];
    let upsSystemsAdded = [];
    
    try {
      // Connect to the NUT server and get UPS list
      upsList = await getUpsListFromNutServer(host, port || 3493, username, password);
      
      // Register each UPS system in the database
      if (upsList && upsList.length > 0) {
        for (const upsName of upsList) {
          try {
            // Check if this UPS system already exists
            const existingUps = await new Promise((resolve, reject) => {
              db.get(
                'SELECT * FROM ups_systems WHERE nut_server_id = ? AND ups_name = ?',
                [serverId, upsName],
                (err, ups) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve(ups);
                }
              );
            });
            
            if (!existingUps) {
              // Add the UPS system to the database
              const upsId = await new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
                  [upsName, serverId, upsName],
                  function(err) {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve(this.lastID);
                  }
                );
              });
              
              upsSystemsAdded.push({
                id: upsId,
                name: upsName,
                upsName: upsName,
                nutServerId: serverId
              });
            }
          } catch (upsErr) {
            console.error(`Error registering UPS ${upsName}:`, upsErr.message);
            // Continue with other UPS systems even if one fails
          }
        }
      }
    } catch (discoveryErr) {
      console.error(`Error discovering UPS systems for server ${host}:${port || 3493}:`, discoveryErr.message);
      // Continue even if discovery fails, as the UPS monitoring system will try again later
    }
    
    return res.status(201).json({
      message: 'NUT server created',
      id: serverId,
      host,
      port: port || 3493,
      username: username || null,
      upsSystemsDiscovered: upsList.length,
      upsSystemsAdded: upsSystemsAdded
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating NUT server', error: error.message });
  }
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
    
    // Get all UPS systems associated with this server
    db.all('SELECT id, name FROM ups_systems WHERE nut_server_id = ?', [serverId], (err, upsSystems) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      // Delete all UPS systems associated with this server
      if (upsSystems && upsSystems.length > 0) {
        console.log(`Deleting ${upsSystems.length} UPS systems associated with NUT server ${serverId}`);
        
        // Delete each UPS system and its associated data
        const deletePromises = upsSystems.map(ups => {
          return new Promise((resolve, reject) => {
            // First delete battery history records
            db.run('DELETE FROM battery_history WHERE ups_id = ?', [ups.id], function(err) {
              if (err) {
                console.error(`Error deleting battery history for UPS ${ups.id} (${ups.name}):`, err.message);
                // Continue with deletion even if battery history deletion fails
              }
              
              console.log(`Deleted battery history for UPS ${ups.id} (${ups.name})`);
              
              // Then delete notification logs
              db.run('DELETE FROM notification_logs WHERE ups_id = ?', [ups.id], function(err) {
                if (err) {
                  console.error(`Error deleting notification logs for UPS ${ups.id} (${ups.name}):`, err.message);
                  // Continue with deletion even if notification logs deletion fails
                }
                
                console.log(`Deleted notification logs for UPS ${ups.id} (${ups.name})`);
                
                // Finally delete the UPS system itself
                db.run('DELETE FROM ups_systems WHERE id = ?', [ups.id], function(err) {
                  if (err) {
                    console.error(`Error deleting UPS system ${ups.id} (${ups.name}):`, err.message);
                    reject(err);
                  } else {
                    console.log(`Deleted UPS system ${ups.id} (${ups.name})`);
                    resolve();
                  }
                });
              });
            });
          });
        });
        
        // Wait for all UPS systems to be deleted
        Promise.all(deletePromises)
          .then(() => {
            // Delete the server
            db.run('DELETE FROM nut_servers WHERE id = ?', [serverId], function(err) {
              if (err) {
                return res.status(500).json({ message: 'Error deleting NUT server', error: err.message });
              }
              
              return res.json({ 
                message: 'NUT server deleted',
                deletedUpsSystems: upsSystems.map(ups => ({ id: ups.id, name: ups.name }))
              });
            });
          })
          .catch(err => {
            return res.status(500).json({ message: 'Error deleting UPS systems', error: err.message });
          });
      } else {
        // No UPS systems to delete, just delete the server
        db.run('DELETE FROM nut_servers WHERE id = ?', [serverId], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error deleting NUT server', error: err.message });
          }
          
          return res.json({ message: 'NUT server deleted' });
        });
      }
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
router.put('/config', authenticateToken, async (req, res) => {
  const { host, port, username, password } = req.body;
  
  if (!host) {
    return res.status(400).json({ message: 'Server host is required' });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can update NUT server configuration' });
  }
  
  try {
    const server = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM nut_servers LIMIT 1', (err, server) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(server);
      });
    });
    
    let serverId;
    
    if (!server) {
      // Insert new configuration
      serverId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO nut_servers (host, port, username, password) VALUES (?, ?, ?, ?)',
          [host, port || 3493, username || null, password || null],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve(this.lastID);
          }
        );
      });
    } else {
      // Update existing configuration
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE nut_servers SET host = ?, port = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [host, port || 3493, username || null, password || null, server.id],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
      serverId = server.id;
    }
    
    // Try to discover and register UPS systems for this server
    let upsList = [];
    let upsSystemsAdded = [];
    
    try {
      // Connect to the NUT server and get UPS list
      upsList = await getUpsListFromNutServer(host, port || 3493, username, password);
      
      // Register each UPS system in the database
      if (upsList && upsList.length > 0) {
        for (const upsName of upsList) {
          try {
            // Check if this UPS system already exists
            const existingUps = await new Promise((resolve, reject) => {
              db.get(
                'SELECT * FROM ups_systems WHERE nut_server_id = ? AND ups_name = ?',
                [serverId, upsName],
                (err, ups) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve(ups);
                }
              );
            });
            
            if (!existingUps) {
              // Add the UPS system to the database
              const upsId = await new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO ups_systems (name, nut_server_id, ups_name) VALUES (?, ?, ?)',
                  [upsName, serverId, upsName],
                  function(err) {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve(this.lastID);
                  }
                );
              });
              
              upsSystemsAdded.push({
                id: upsId,
                name: upsName,
                upsName: upsName,
                nutServerId: serverId
              });
            }
          } catch (upsErr) {
            console.error(`Error registering UPS ${upsName}:`, upsErr.message);
            // Continue with other UPS systems even if one fails
          }
        }
      }
    } catch (discoveryErr) {
      console.error(`Error discovering UPS systems for server ${host}:${port || 3493}:`, discoveryErr.message);
      // Continue even if discovery fails, as the UPS monitoring system will try again later
    }
    
    return res.json({
      message: server ? 'NUT server configuration updated' : 'NUT server configuration created',
      id: serverId,
      host,
      port: port || 3493,
      upsSystemsDiscovered: upsList.length,
      upsSystemsAdded: upsSystemsAdded
    });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error updating NUT server configuration', 
      error: error.message 
    });
  }
});

module.exports = router;
