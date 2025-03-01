-- Add poll_interval column to notification_settings table
ALTER TABLE notification_settings ADD COLUMN poll_interval INTEGER DEFAULT 30;

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
--     email_recipients = ?,
--     poll_interval = ?
-- WHERE user_id = ?

-- Update the INSERT settings query
-- This is just a comment for reference, no SQL to execute
-- INSERT INTO notification_settings 
-- (user_id, discord_webhook_url, slack_webhook_url, notifications_enabled, battery_notifications, low_battery_notifications, email_notifications, email_recipients, poll_interval) 
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
