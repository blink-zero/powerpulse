-- Create user_settings table to store user-specific settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  inactivity_timeout INTEGER DEFAULT 30,
  poll_interval INTEGER DEFAULT 30,
  dark_mode INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add missing columns to user_settings table if they don't exist
-- This is a direct approach to ensure the columns exist, regardless of migrations
-- (This is a comment for reference, SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
