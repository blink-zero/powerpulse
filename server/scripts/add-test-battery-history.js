const db = require('../db');

// Get UPS systems
db.all('SELECT id FROM ups_systems', (err, systems) => {
  if (err) {
    console.error('Error fetching UPS systems:', err);
    process.exit(1);
  }
  
  if (systems.length === 0) {
    console.log('No UPS systems found. Please add UPS systems first.');
    process.exit(0);
  }
  
  console.log(`Found ${systems.length} UPS systems. Adding test battery history data...`);
  
  // For each UPS system, add 24 hours of test data
  systems.forEach(system => {
    const upsId = system.id;
    
    // Create 24 data points (one per hour for the last 24 hours)
    const now = new Date();
    const stmt = db.prepare('INSERT INTO battery_history (ups_id, charge_percent, timestamp) VALUES (?, ?, ?)');
    
    for (let i = 0; i < 24; i++) {
      // Generate a timestamp i hours ago
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Generate a random battery charge between 50% and 100%
      // Make it somewhat realistic by having it decrease over time
      const baseCharge = 80 + Math.random() * 20; // 80-100%
      const timeDecay = i * 0.5; // Decrease by 0.5% per hour
      const chargePercent = Math.max(50, Math.min(100, baseCharge - timeDecay));
      
      // Insert the data point
      stmt.run([upsId, chargePercent, timestamp.toISOString()], err => {
        if (err) {
          console.error(`Error adding battery history for UPS ${upsId}:`, err);
        }
      });
    }
    
    stmt.finalize();
    console.log(`Added 24 hours of test data for UPS ${upsId}`);
  });
  
  console.log('Test data generation complete.');
});
