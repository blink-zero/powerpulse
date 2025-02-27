const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Database setup
// Always use the data directory for consistency between Docker and local development
const dataDir = path.resolve(__dirname, '../data');
const dbPath = path.resolve(dataDir, 'database.sqlite');

console.log(`Database directory path: ${dataDir}`);
console.log(`Database file path: ${dbPath}`);

// Create the data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  console.log(`Creating data directory: ${dataDir}`);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Data directory created: ${dataDir}`);
  } catch (err) {
    console.error(`Error creating data directory: ${err.message}`);
  }
}

// Set permissions on the data directory
try {
  // Set permissions to 750 (rwxr-x---)
  fs.chmodSync(dataDir, 0o750);
  console.log(`Set permissions on data directory: ${dataDir} (750)`);
} catch (err) {
  console.error(`Error setting permissions on data directory: ${err.message}`);
}

// Open the database in read-write mode (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database in read-write mode');
    
    // Set permissions on the database file
    try {
      // Set permissions to 640 (rw-r-----)
      fs.chmodSync(dbPath, 0o640);
      console.log(`Set permissions on database file: ${dbPath} (640)`);
    } catch (err) {
      console.error(`Error setting permissions on database file: ${err.message}`);
    }
    
    initializeDatabase();
  }
});

// Apply database migrations
function applyMigrations() {
  return new Promise((resolve, reject) => {
    console.log('Applying database migrations...');
    
    // Read migration files
    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found, skipping migrations');
      return resolve();
    }
    
    try {
      // Apply add_extended_notification_settings.sql migration
      const extendedNotificationSettingsPath = path.resolve(migrationsDir, 'add_extended_notification_settings.sql');
      if (fs.existsSync(extendedNotificationSettingsPath)) {
        const sql = fs.readFileSync(extendedNotificationSettingsPath, 'utf8');
        // Split by semicolon to get individual statements, filter out comments and empty lines
        const statements = sql.split(';')
          .map(statement => statement.trim())
          .filter(statement => statement && !statement.startsWith('--'));
        
        // Execute each statement sequentially with promises
        const executeStatements = async () => {
          for (const statement of statements) {
            if (statement) {
              await new Promise((resolveStatement, rejectStatement) => {
                console.log(`Executing migration statement: ${statement}`);
                db.run(statement, function(err) {
                  if (err) {
                    // Ignore errors about column already existing
                    if (err.message.includes('duplicate column name')) {
                      console.log(`Column already exists, skipping: ${err.message}`);
                    } else {
                      console.error(`Error executing migration statement: ${err.message}`);
                    }
                  }
                  resolveStatement();
                });
              });
            }
          }
        };
        
        // Execute statements and wait for completion
        return executeStatements().then(() => {
          console.log('Applied add_extended_notification_settings.sql migration');
          resolve();
        });
      } else {
        console.log('add_extended_notification_settings.sql migration file not found');
        resolve();
      }
    } catch (err) {
      console.error('Error applying migrations:', err);
      // Continue with initialization even if migrations fail
      resolve();
    }
  });
}

// Initialize database tables
async function initializeDatabase() {
  // Apply migrations first
  await applyMigrations();
  
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // NUT Server configuration
    db.run(`
      CREATE TABLE IF NOT EXISTS nut_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 3493,
        username TEXT,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // UPS Systems
    db.run(`
      CREATE TABLE IF NOT EXISTS ups_systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        nut_server_id INTEGER,
        ups_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nut_server_id) REFERENCES nut_servers (id)
      )
    `);

    // Battery History
    db.run(`
      CREATE TABLE IF NOT EXISTS battery_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ups_id INTEGER NOT NULL,
        charge_percent REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ups_id) REFERENCES ups_systems (id)
      )
    `);

    // Notification Settings
    db.run(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        discord_webhook_url TEXT DEFAULT '',
        slack_webhook_url TEXT DEFAULT '',
        notifications_enabled INTEGER DEFAULT 1,
        battery_notifications INTEGER DEFAULT 1,
        low_battery_notifications INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 0,
        email_recipients TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add missing columns to notification_settings table if they don't exist
    // This is a direct approach to ensure the columns exist, regardless of migrations
    db.run(`PRAGMA table_info(notification_settings)`, (err, columns) => {
      if (err) {
        console.error('Error getting notification_settings columns:', err.message);
        return;
      }
      
      // Check if slack_webhook_url column exists
      const hasSlackWebhook = columns && columns.some(col => col.name === 'slack_webhook_url');
      if (!hasSlackWebhook) {
        console.log('Adding slack_webhook_url column to notification_settings table');
        db.run('ALTER TABLE notification_settings ADD COLUMN slack_webhook_url TEXT DEFAULT ""', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding slack_webhook_url column:', err.message);
          }
        });
      }
      
      // Check if email_notifications column exists
      const hasEmailNotifications = columns && columns.some(col => col.name === 'email_notifications');
      if (!hasEmailNotifications) {
        console.log('Adding email_notifications column to notification_settings table');
        db.run('ALTER TABLE notification_settings ADD COLUMN email_notifications INTEGER DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding email_notifications column:', err.message);
          }
        });
      }
      
      // Check if email_recipients column exists
      const hasEmailRecipients = columns && columns.some(col => col.name === 'email_recipients');
      if (!hasEmailRecipients) {
        console.log('Adding email_recipients column to notification_settings table');
        db.run('ALTER TABLE notification_settings ADD COLUMN email_recipients TEXT DEFAULT ""', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding email_recipients column:', err.message);
          }
        });
      }
    });

    // Notification Logs
    db.run(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ups_id INTEGER NOT NULL,
        ups_name TEXT NOT NULL,
        status TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ups_id) REFERENCES ups_systems(id) ON DELETE CASCADE
      )
    `);

    // UPS Status table for tracking status changes
    db.run(`
      CREATE TABLE IF NOT EXISTS ups_status (
        ups_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create indexes for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_ups_id ON notification_logs(ups_id)`);
  });
}

module.exports = db;
