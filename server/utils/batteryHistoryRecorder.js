const db = require('../db');

/**
 * Records battery charge history for all UPS systems
 * @param {Array} upsSystems - Array of UPS systems with current data
 */
const recordBatteryHistory = (upsSystems) => {
  if (!upsSystems || !Array.isArray(upsSystems) || upsSystems.length === 0) {
    return;
  }

  // Get current timestamp
  const now = new Date();
  
  // Only record history if at least 5 minutes have passed since the last record
  // This prevents database bloat from too frequent recordings
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Format the timestamp for SQLite
  const formattedTime = fiveMinutesAgo.toISOString();
  
  // Check when the last record was made
  db.get(
    'SELECT MAX(timestamp) as last_record FROM battery_history',
    (err, result) => {
      if (err) {
        console.error('Error checking last battery history record:', err);
        return;
      }
      
      // If no records exist or the last record is older than 5 minutes, record new data
      if (!result.last_record || new Date(result.last_record) < fiveMinutesAgo) {
        // Prepare batch insert statement
        const stmt = db.prepare(
          'INSERT INTO battery_history (ups_id, charge_percent) VALUES (?, ?)'
        );
        
        // Record battery charge for each UPS system
        upsSystems.forEach(ups => {
          if (ups.id && ups.batteryCharge !== undefined && ups.batteryCharge !== null) {
            stmt.run([ups.id, ups.batteryCharge], (err) => {
              if (err) {
                console.error(`Error recording battery history for UPS ${ups.id}:`, err);
              }
            });
          }
        });
        
        // Finalize the statement
        stmt.finalize();
        
        console.log(`Recorded battery history for ${upsSystems.length} UPS systems at ${now.toISOString()}`);
      }
    }
  );
  
  // Clean up old records (keep only last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formattedSevenDaysAgo = sevenDaysAgo.toISOString();
  
  db.run(
    'DELETE FROM battery_history WHERE timestamp < ?',
    [formattedSevenDaysAgo],
    function(err) {
      if (err) {
        console.error('Error cleaning up old battery history records:', err);
      } else if (this.changes > 0) {
        console.log(`Cleaned up ${this.changes} old battery history records`);
      }
    }
  );
};

module.exports = {
  recordBatteryHistory
};
