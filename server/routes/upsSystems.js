const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getNutUpsData } = require('../utils/nutClient');

const router = express.Router();

// Get all UPS systems from database
router.get('/', authenticateToken, async (req, res) => {
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
                  nickname: dbSystem.nickname,
                  displayName: dbSystem.nickname || liveUps.displayName || dbSystem.name,
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
                  temperature: liveUps.temperature,
                  // Include extended details
                  batteryDetails: liveUps.batteryDetails,
                  deviceDetails: liveUps.deviceDetails,
                  driverDetails: liveUps.driverDetails,
                  inputDetails: liveUps.inputDetails,
                  outputDetails: liveUps.outputDetails,
                  upsDetails: liveUps.upsDetails,
                  rawVariables: liveUps.rawVariables
                };
              } else {
                // Return basic info if live data not available
                return {
                  id: dbSystem.id,
                  name: dbSystem.name,
                  nickname: dbSystem.nickname,
                  displayName: dbSystem.nickname || dbSystem.name,
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
router.get('/:id', authenticateToken, async (req, res) => {
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
              nickname: dbSystem.nickname,
              displayName: dbSystem.nickname || dbSystem.name,
              upsName: dbSystem.ups_name,
              nutServerId: dbSystem.nut_server_id,
              status: 'Unknown',
              batteryCharge: null,
              runtimeRemaining: null,
              load: null
            });
          }
          
          // Record battery charge for history
          if (matchingUps.batteryCharge !== undefined && matchingUps.batteryCharge !== null) {
            db.get(
              'SELECT MAX(timestamp) as last_record FROM battery_history WHERE ups_id = ?',
              [dbSystem.id],
              (err, result) => {
                if (err) {
                  console.error(`Error checking last battery history record for UPS ${dbSystem.id}:`, err);
                } else {
                  // Only record if no previous record exists or if the last record is older than 5 minutes
                  const now = new Date();
                  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                  
                  if (!result.last_record || new Date(result.last_record) < fiveMinutesAgo) {
                    db.run(
                      'INSERT INTO battery_history (ups_id, charge_percent) VALUES (?, ?)',
                      [dbSystem.id, matchingUps.batteryCharge],
                      (err) => {
                        if (err) {
                          console.error(`Error recording battery history for UPS ${dbSystem.id}:`, err);
                        } else {
                          console.log(`Recorded battery charge ${matchingUps.batteryCharge}% for UPS ${dbSystem.id}`);
                        }
                      }
                    );
                  }
                }
              }
            );
          }
          
          // Combine database and live data
          return res.json({
            id: dbSystem.id,
            name: dbSystem.name,
            nickname: dbSystem.nickname,
            displayName: dbSystem.nickname || matchingUps.displayName || dbSystem.name,
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
            temperature: matchingUps.temperature,
            // Include extended details
            batteryDetails: matchingUps.batteryDetails,
            deviceDetails: matchingUps.deviceDetails,
            driverDetails: matchingUps.driverDetails,
            inputDetails: matchingUps.inputDetails,
            outputDetails: matchingUps.outputDetails,
            upsDetails: matchingUps.upsDetails,
            rawVariables: matchingUps.rawVariables
          });
        } catch (error) {
          console.error('Error getting UPS data:', error);
          
          // Return basic info if there's an error
          return res.json({
            id: dbSystem.id,
            name: dbSystem.name,
            nickname: dbSystem.nickname,
            displayName: dbSystem.nickname || dbSystem.name,
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
router.post('/', authenticateToken, (req, res) => {
  const { name, nickname, nutServerId, upsName } = req.body;
  
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
      'INSERT INTO ups_systems (name, nickname, nut_server_id, ups_name) VALUES (?, ?, ?, ?)',
      [name, nickname || null, nutServerId, upsName],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating UPS system', error: err.message });
        }
        
        return res.status(201).json({
          message: 'UPS system created',
          id: this.lastID,
          name,
          nickname,
          nutServerId,
          upsName
        });
      }
    );
  });
});

// Update a UPS system
router.put('/:id', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const { name, nickname, nutServerId, upsName } = req.body;
  
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
        'UPDATE ups_systems SET name = ?, nickname = ?, nut_server_id = ?, ups_name = ? WHERE id = ?',
        [name, nickname || null, nutServerId, upsName, upsId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error updating UPS system', error: err.message });
          }
          
          return res.json({
            message: 'UPS system updated',
            id: upsId,
            name,
            nickname,
            nutServerId,
            upsName
          });
        }
      );
    });
  });
});

// Update UPS system nickname
router.put('/:id/nickname', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const { nickname } = req.body;
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Update UPS system nickname
    db.run(
      'UPDATE ups_systems SET nickname = ? WHERE id = ?',
      [nickname || null, upsId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating UPS system nickname', error: err.message });
        }
        
        return res.json({
          message: 'UPS system nickname updated',
          id: upsId,
          nickname
        });
      }
    );
  });
});

// Delete a UPS system
router.delete('/:id', authenticateToken, (req, res) => {
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
    
    // First delete notification logs
    db.run('DELETE FROM notification_logs WHERE ups_id = ?', [upsId], function(err) {
      if (err) {
        console.error(`Error deleting notification logs for UPS ${upsId}:`, err.message);
        // Continue with deletion even if notification logs deletion fails
      }
      
      console.log(`Deleted notification logs for UPS ${upsId}`);
      
      // Then delete battery history
      db.run('DELETE FROM battery_history WHERE ups_id = ?', [upsId], function(err) {
        if (err) {
          console.error(`Error deleting battery history for UPS ${upsId}:`, err.message);
          // Continue with deletion even if battery history deletion fails
        }
        
        console.log(`Deleted battery history for UPS ${upsId}`);
        
        // Finally delete the UPS system itself
        db.run('DELETE FROM ups_systems WHERE id = ?', [upsId], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error deleting UPS system', error: err.message });
          }
          
          console.log(`Successfully deleted UPS system ${upsId}`);
          return res.json({ 
            message: 'UPS system deleted',
            id: upsId
          });
        });
      });
    });
  });
});

// Record battery charge for a UPS system
router.post('/:id/battery', authenticateToken, (req, res) => {
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

// Get battery history for a UPS system
router.get('/:id/battery', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.id);
  const limit = parseInt(req.query.limit) || 100; // Default to 100 records
  
  // Check if UPS system exists
  db.get('SELECT id FROM ups_systems WHERE id = ?', [upsId], (err, ups) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!ups) {
      return res.status(404).json({ message: 'UPS system not found' });
    }
    
    // Get battery history
    db.all(
      'SELECT * FROM battery_history WHERE ups_id = ? ORDER BY timestamp DESC LIMIT ?',
      [upsId, limit],
      (err, history) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        return res.json(history || []);
      }
    );
  });
});

module.exports = router;
