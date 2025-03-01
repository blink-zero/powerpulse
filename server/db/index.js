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
      // Get all migration files
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => path.resolve(migrationsDir, file));
      
      if (migrationFiles.length === 0) {
        console.log('No migration files found');
        return resolve();
      }
      
      // Execute each migration file
      const executeMigrations = async () => {
        for (const migrationPath of migrationFiles) {
          const migrationName = path.basename(migrationPath);
          console.log(`Applying migration: ${migrationName}`);
          
          const sql = fs.readFileSync(migrationPath, 'utf8');
          // Split by semicolon to get individual statements, filter out comments and empty lines
          const statements = sql.split(';')
            .map(statement => statement.trim())
            .filter(statement => statement && !statement.startsWith('--'));
          
          // Execute each statement in the migration
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
          
          console.log(`Applied migration: ${migrationName}`);
        }
      };
      
      // Execute migrations and wait for completion
      return executeMigrations().then(() => {
        console.log('All migrations applied successfully');
        resolve();
      });
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
        nickname TEXT DEFAULT NULL,
        nut_server_id INTEGER,
        ups_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nut_server_id) REFERENCES nut_servers (id)
      )
    `);
    
    // Add nickname column to ups_systems table if it doesn't exist
    db.run(`PRAGMA table_info(ups_systems)`, (err, columns) => {
      if (err) {
        console.error('Error getting ups_systems columns:', err.message);
        return;
      }
      
      // Check if nickname column exists
      const hasNickname = columns && columns.some(col => col.name === 'nickname');
      if (!hasNickname) {
        console.log('Adding nickname column to ups_systems table');
        db.run('ALTER TABLE ups_systems ADD COLUMN nickname TEXT DEFAULT NULL', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding nickname column:', err.message);
          } else {
            console.log('Successfully added nickname column to ups_systems table');
          }
        });
      }
    });

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
      
      // Check if poll_interval column exists
      const hasPollInterval = columns && columns.some(col => col.name === 'poll_interval');
      if (!hasPollInterval) {
        console.log('Adding poll_interval column to notification_settings table');
        db.run('ALTER TABLE notification_settings ADD COLUMN poll_interval INTEGER DEFAULT 30', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding poll_interval column:', err.message);
          } else {
            console.log('Successfully added poll_interval column to notification_settings table');
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

    // User Settings
    db.run(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        inactivity_timeout INTEGER DEFAULT 30,
        discord_webhook_url TEXT DEFAULT '',
        slack_webhook_url TEXT DEFAULT '',
        notifications_enabled INTEGER DEFAULT 1,
        battery_notifications INTEGER DEFAULT 1,
        low_battery_notifications INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 0,
        email_recipients TEXT DEFAULT '',
        poll_interval INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add missing columns to user_settings table if they don't exist
    db.run(`PRAGMA table_info(user_settings)`, (err, columns) => {
      if (err) {
        console.error('Error getting user_settings columns:', err.message);
        return;
      }
      
      // Check if discord_webhook_url column exists
      const hasDiscordWebhook = columns && columns.some(col => col.name === 'discord_webhook_url');
      if (!hasDiscordWebhook) {
        console.log('Adding discord_webhook_url column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN discord_webhook_url TEXT DEFAULT ""', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding discord_webhook_url column:', err.message);
          } else {
            console.log('Successfully added discord_webhook_url column to user_settings table');
          }
        });
      }
      
      // Check if slack_webhook_url column exists
      const hasSlackWebhook = columns && columns.some(col => col.name === 'slack_webhook_url');
      if (!hasSlackWebhook) {
        console.log('Adding slack_webhook_url column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN slack_webhook_url TEXT DEFAULT ""', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding slack_webhook_url column:', err.message);
          } else {
            console.log('Successfully added slack_webhook_url column to user_settings table');
          }
        });
      }
      
      // Check if notifications_enabled column exists
      const hasNotificationsEnabled = columns && columns.some(col => col.name === 'notifications_enabled');
      if (!hasNotificationsEnabled) {
        console.log('Adding notifications_enabled column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN notifications_enabled INTEGER DEFAULT 1', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding notifications_enabled column:', err.message);
          } else {
            console.log('Successfully added notifications_enabled column to user_settings table');
          }
        });
      }
      
      // Check if battery_notifications column exists
      const hasBatteryNotifications = columns && columns.some(col => col.name === 'battery_notifications');
      if (!hasBatteryNotifications) {
        console.log('Adding battery_notifications column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN battery_notifications INTEGER DEFAULT 1', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding battery_notifications column:', err.message);
          } else {
            console.log('Successfully added battery_notifications column to user_settings table');
          }
        });
      }
      
      // Check if low_battery_notifications column exists
      const hasLowBatteryNotifications = columns && columns.some(col => col.name === 'low_battery_notifications');
      if (!hasLowBatteryNotifications) {
        console.log('Adding low_battery_notifications column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN low_battery_notifications INTEGER DEFAULT 1', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding low_battery_notifications column:', err.message);
          } else {
            console.log('Successfully added low_battery_notifications column to user_settings table');
          }
        });
      }
      
      // Check if email_notifications column exists
      const hasEmailNotifications = columns && columns.some(col => col.name === 'email_notifications');
      if (!hasEmailNotifications) {
        console.log('Adding email_notifications column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN email_notifications INTEGER DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding email_notifications column:', err.message);
          } else {
            console.log('Successfully added email_notifications column to user_settings table');
          }
        });
      }
      
      // Check if email_recipients column exists
      const hasEmailRecipients = columns && columns.some(col => col.name === 'email_recipients');
      if (!hasEmailRecipients) {
        console.log('Adding email_recipients column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN email_recipients TEXT DEFAULT ""', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding email_recipients column:', err.message);
          } else {
            console.log('Successfully added email_recipients column to user_settings table');
          }
        });
      }
      
      // Check if poll_interval column exists
      const hasPollInterval = columns && columns.some(col => col.name === 'poll_interval');
      if (!hasPollInterval) {
        console.log('Adding poll_interval column to user_settings table');
        db.run('ALTER TABLE user_settings ADD COLUMN poll_interval INTEGER DEFAULT 30', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding poll_interval column:', err.message);
          } else {
            console.log('Successfully added poll_interval column to user_settings table');
          }
        });
      }
    });

    // Create indexes for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_ups_id ON notification_logs(ups_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)`);
  });
}

module.exports = db;
