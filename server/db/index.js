const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database setup
// Use data directory for Docker volume if it exists, otherwise use the current directory
const dataDir = fs.existsSync(path.resolve(__dirname, '../data')) ? path.resolve(__dirname, '../data') : path.resolve(__dirname, '..');
const dbPath = path.resolve(dataDir, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
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
        notifications_enabled INTEGER DEFAULT 1,
        battery_notifications INTEGER DEFAULT 1,
        low_battery_notifications INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

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

    // Create indexes for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notification_logs_ups_id ON notification_logs(ups_id)`);
  });
}

module.exports = db;
