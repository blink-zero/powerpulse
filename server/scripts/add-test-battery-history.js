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
  
  // For each UPS system, add 7 days of test data
  systems.forEach(system => {
    const upsId = system.id;
    
    // Create 168 data points (one per hour for the last 7 days)
    const now = new Date();
    const stmt = db.prepare('INSERT INTO battery_history (ups_id, charge_percent, timestamp) VALUES (?, ?, ?)');
    
    for (let i = 0; i < 168; i++) {
      // Generate a timestamp i hours ago
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Generate a random battery charge between 50% and 100%
      // Make it somewhat realistic by having it fluctuate over time
      // Create a pattern that simulates daily charging cycles
      const dayIndex = Math.floor(i / 24); // Which day we're on (0-6)
      const hourOfDay = i % 24; // Hour of the day (0-23)
      
      // Base charge starts high and has a slight downward trend over the week
      const baseCharge = 95 - (dayIndex * 2) + (Math.random() * 5); // 95-100% at start, gradually decreasing
      
      // Daily pattern: higher during day (charging), lower at night (discharging)
      const hourlyPattern = hourOfDay >= 8 && hourOfDay <= 18 
        ? 5 // During "work hours" (8am-6pm), battery tends to be higher (charging)
        : -5; // During night, battery tends to be lower (discharging)
      
      // Add some randomness
      const randomVariation = (Math.random() * 10) - 5; // -5 to +5
      
      // Calculate final charge percent
      const chargePercent = Math.max(50, Math.min(100, baseCharge + hourlyPattern + randomVariation));
      
      // Insert the data point
      stmt.run([upsId, chargePercent, timestamp.toISOString()], err => {
        if (err) {
          console.error(`Error adding battery history for UPS ${upsId}:`, err);
        }
      });
    }
    
    stmt.finalize();
    console.log(`Added 7 days of test data for UPS ${upsId}`);
  });
  
  console.log('Test data generation complete.');
});
