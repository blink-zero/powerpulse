const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database setup
const dataDir = path.resolve(__dirname, '../data');
const dbPath = path.resolve(dataDir, 'database.sqlite');

console.log(`Database directory path: ${dataDir}`);
console.log(`Database file path: ${dbPath}`);

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database');
  
  // Apply the migration
  applyMigration();
});

// Apply the migration
function applyMigration() {
  console.log('Applying settings migration...');
  
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Add notification-related columns to user_settings table
    console.log('Adding notification-related columns to user_settings table...');
    
    const alterTableStatements = [
      'ALTER TABLE user_settings ADD COLUMN discord_webhook_url TEXT DEFAULT ""',
      'ALTER TABLE user_settings ADD COLUMN slack_webhook_url TEXT DEFAULT ""',
      'ALTER TABLE user_settings ADD COLUMN notifications_enabled INTEGER DEFAULT 1',
      'ALTER TABLE user_settings ADD COLUMN battery_notifications INTEGER DEFAULT 1',
      'ALTER TABLE user_settings ADD COLUMN low_battery_notifications INTEGER DEFAULT 1',
      'ALTER TABLE user_settings ADD COLUMN email_notifications INTEGER DEFAULT 0',
      'ALTER TABLE user_settings ADD COLUMN email_recipients TEXT DEFAULT ""',
      'ALTER TABLE user_settings ADD COLUMN poll_interval INTEGER DEFAULT 30'
    ];
    
    // Execute each ALTER TABLE statement
    alterTableStatements.forEach(statement => {
      db.run(statement, function(err) {
        if (err) {
          // Ignore errors about column already existing
          if (err.message.includes('duplicate column name')) {
            console.log(`Column already exists, skipping: ${err.message}`);
          } else {
            console.error(`Error executing statement: ${err.message}`);
            db.run('ROLLBACK');
            process.exit(1);
          }
        }
      });
    });
    
    // Copy data from notification_settings to user_settings
    console.log('Copying data from notification_settings to user_settings...');
    
    // First, get all users with notification settings
    db.all('SELECT user_id FROM notification_settings', [], (err, rows) => {
      if (err) {
        console.error('Error fetching users with notification settings:', err.message);
        db.run('ROLLBACK');
        process.exit(1);
      }
      
      if (rows.length === 0) {
        console.log('No notification settings found to migrate');
      } else {
        console.log(`Found ${rows.length} users with notification settings to migrate`);
        
        // For each user, copy their notification settings to user_settings
        rows.forEach(row => {
          const userId = row.user_id;
          
          // Check if the user already has user_settings
          db.get('SELECT id FROM user_settings WHERE user_id = ?', [userId], (err, userSettings) => {
            if (err) {
              console.error(`Error checking user_settings for user ${userId}:`, err.message);
              return;
            }
            
            // Get the notification settings for this user
            db.get('SELECT * FROM notification_settings WHERE user_id = ?', [userId], (err, notificationSettings) => {
              if (err) {
                console.error(`Error fetching notification_settings for user ${userId}:`, err.message);
                return;
              }
              
              if (!notificationSettings) {
                console.log(`No notification settings found for user ${userId}`);
                return;
              }
              
              console.log(`Migrating notification settings for user ${userId}:`, notificationSettings);
              
              if (userSettings) {
                // User already has user_settings, update it
                const updateSql = `
                  UPDATE user_settings 
                  SET discord_webhook_url = ?,
                      slack_webhook_url = ?,
                      notifications_enabled = ?,
                      battery_notifications = ?,
                      low_battery_notifications = ?,
                      email_notifications = ?,
                      email_recipients = ?,
                      poll_interval = ?,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE user_id = ?
                `;
                
                db.run(updateSql, [
                  notificationSettings.discord_webhook_url || '',
                  notificationSettings.slack_webhook_url || '',
                  notificationSettings.notifications_enabled,
                  notificationSettings.battery_notifications,
                  notificationSettings.low_battery_notifications,
                  notificationSettings.email_notifications || 0,
                  notificationSettings.email_recipients || '',
                  notificationSettings.poll_interval || 30,
                  userId
                ], function(err) {
                  if (err) {
                    console.error(`Error updating user_settings for user ${userId}:`, err.message);
                  } else {
                    console.log(`Updated user_settings for user ${userId}`);
                  }
                });
              } else {
                // User doesn't have user_settings, insert a new row
                const insertSql = `
                  INSERT INTO user_settings (
                    user_id,
                    inactivity_timeout,
                    discord_webhook_url,
                    slack_webhook_url,
                    notifications_enabled,
                    battery_notifications,
                    low_battery_notifications,
                    email_notifications,
                    email_recipients,
                    poll_interval,
                    created_at,
                    updated_at
                  ) VALUES (?, 30, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `;
                
                db.run(insertSql, [
                  userId,
                  notificationSettings.discord_webhook_url || '',
                  notificationSettings.slack_webhook_url || '',
                  notificationSettings.notifications_enabled,
                  notificationSettings.battery_notifications,
                  notificationSettings.low_battery_notifications,
                  notificationSettings.email_notifications || 0,
                  notificationSettings.email_recipients || '',
                  notificationSettings.poll_interval || 30
                ], function(err) {
                  if (err) {
                    console.error(`Error inserting user_settings for user ${userId}:`, err.message);
                  } else {
                    console.log(`Inserted user_settings for user ${userId}`);
                  }
                });
              }
            });
          });
        });
      }
    });
    
    // Create a view to maintain backward compatibility
    console.log('Creating notification_settings_view...');
    
    db.run(`
      CREATE VIEW IF NOT EXISTS notification_settings_view AS
      SELECT 
        id,
        user_id,
        discord_webhook_url,
        slack_webhook_url,
        notifications_enabled,
        battery_notifications,
        low_battery_notifications,
        email_notifications,
        email_recipients,
        poll_interval,
        created_at,
        updated_at
      FROM user_settings
    `, function(err) {
      if (err) {
        console.error('Error creating notification_settings_view:', err.message);
        db.run('ROLLBACK');
        process.exit(1);
      } else {
        console.log('Created notification_settings_view');
      }
    });
    
    // Commit the transaction
    db.run('COMMIT', function(err) {
      if (err) {
        console.error('Error committing transaction:', err.message);
        db.run('ROLLBACK');
        process.exit(1);
      } else {
        console.log('Migration completed successfully');
        
        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          process.exit(0);
        });
      }
    });
  });
}
