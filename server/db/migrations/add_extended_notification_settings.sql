-- Add new columns to notification_settings table
ALTER TABLE notification_settings ADD COLUMN slack_webhook_url TEXT DEFAULT '';
ALTER TABLE notification_settings ADD COLUMN email_notifications INTEGER DEFAULT 0;
ALTER TABLE notification_settings ADD COLUMN email_recipients TEXT DEFAULT '';

-- Update the GET settings query
-- This is just a comment for reference, no SQL to execute
-- SELECT * FROM notification_settings WHERE user_id = ?

-- Update the UPDATE settings query
-- This is just a comment for reference, no SQL to execute
-- UPDATE notification_settings 
-- SET discord_webhook_url = ?, 
--     slack_webhook_url = ?,
--     notifications_enabled = ?, 
--     battery_notifications = ?, 
--     low_battery_notifications = ?,
--     email_notifications = ?,
--     email_recipients = ?
-- WHERE user_id = ?

-- Update the INSERT settings query
-- This is just a comment for reference, no SQL to execute
-- INSERT INTO notification_settings 
-- (user_id, discord_webhook_url, slack_webhook_url, notifications_enabled, battery_notifications, low_battery_notifications, email_notifications, email_recipients) 
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?)
