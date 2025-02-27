const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Debug endpoint to directly fetch battery history from the database
router.get('/battery-history/:upsId', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.upsId);
  const days = parseInt(req.query.days) || 7; // Default to 7 days
  
  console.log(`Debug: Fetching battery history for UPS ${upsId} for the last ${days} days`);
  
  // Calculate the date for N days ago
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  const daysAgoStr = daysAgo.toISOString();
  
  // Get battery history for this UPS for the last N days
  db.all(
    'SELECT * FROM battery_history WHERE ups_id = ? AND timestamp >= ? ORDER BY timestamp ASC',
    [upsId, daysAgoStr],
    (err, history) => {
      if (err) {
        console.error(`Debug: Error fetching battery history: ${err.message}`);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      console.log(`Debug: Found ${history?.length || 0} battery history records in the last ${days} days`);
      
      // Return the raw data
      return res.json(history || []);
    }
  );
});

// Debug endpoint to manually record battery charge
router.post('/record-battery/:upsId/:charge', authenticateToken, (req, res) => {
  const upsId = parseInt(req.params.upsId);
  const chargePercent = parseFloat(req.params.charge);
  
  if (isNaN(chargePercent) || chargePercent < 0 || chargePercent > 100) {
    return res.status(400).json({ message: 'Invalid charge percentage' });
  }
  
  console.log(`Debug: Recording battery charge ${chargePercent}% for UPS ${upsId}`);
  
  // Record battery charge
  db.run(
    'INSERT INTO battery_history (ups_id, charge_percent) VALUES (?, ?)',
    [upsId, chargePercent],
    function(err) {
      if (err) {
        console.error(`Debug: Error recording battery charge: ${err.message}`);
        return res.status(500).json({ message: 'Error recording battery charge', error: err.message });
      }
      
      console.log(`Debug: Battery charge recorded with ID ${this.lastID}`);
      
      return res.status(201).json({
        message: 'Battery charge recorded',
        id: this.lastID,
        upsId,
        chargePercent,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Debug endpoint to list all tables in the database
router.get('/tables', authenticateToken, (req, res) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table'",
    (err, tables) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(tables);
    }
  );
});

// Debug endpoint to show table schema
router.get('/schema/:table', authenticateToken, (req, res) => {
  const tableName = req.params.table;
  
  db.all(
    `PRAGMA table_info(${tableName})`,
    (err, columns) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(columns);
    }
  );
});

// Debug endpoint to count records in a table
router.get('/count/:table', authenticateToken, (req, res) => {
  const tableName = req.params.table;
  
  db.get(
    `SELECT COUNT(*) as count FROM ${tableName}`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      return res.json(result);
    }
  );
});

module.exports = router;
