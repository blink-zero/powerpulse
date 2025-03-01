-- Add notification-related columns to user_settings table
ALTER TABLE user_settings ADD COLUMN discord_webhook_url TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN slack_webhook_url TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN notifications_enabled INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN battery_notifications INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN low_battery_notifications INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN email_notifications INTEGER DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN email_recipients TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN poll_interval INTEGER DEFAULT 30;

-- Copy data from notification_settings to user_settings
INSERT OR REPLACE INTO user_settings (
  user_id, 
  discord_webhook_url, 
  slack_webhook_url, 
  notifications_enabled, 
  battery_notifications, 
  low_battery_notifications, 
  email_notifications, 
  email_recipients, 
  poll_interval
)
SELECT 
  user_id, 
  discord_webhook_url, 
  slack_webhook_url, 
  notifications_enabled, 
  battery_notifications, 
  low_battery_notifications, 
  email_notifications, 
  email_recipients, 
  poll_interval
FROM notification_settings;

-- Create a view to maintain backward compatibility
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
FROM user_settings;

-- Note: We're not dropping the notification_settings table yet to maintain backward compatibility
-- This can be done in a future migration after ensuring everything works correctly
