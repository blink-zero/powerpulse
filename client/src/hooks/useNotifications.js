import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';

/**
 * Custom hook for handling UPS status notifications
 * @param {Array} upsSystems - Array of UPS systems to monitor
 * @param {boolean} loading - Loading state of UPS systems
 * @returns {Object} - Notification state and functions
 */
export const useNotifications = (upsSystems, loading) => {
  const { settings } = useSettings();
  const previousUpsStates = useRef({});
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Check for status changes and send notifications
  useEffect(() => {
    if (!upsSystems.length || loading) return;

    // Check if notifications are enabled
    if (!settings.notifications || !settings.discordWebhookUrl) return;

    // Check for status changes
    upsSystems.forEach(ups => {
      const prevState = previousUpsStates.current[ups.id];
      
      // Skip if no previous state (first load)
      if (!prevState) {
        previousUpsStates.current[ups.id] = {
          status: ups.status,
          batteryCharge: ups.batteryCharge
        };
        return;
      }

      // Check for status changes
      if (prevState.status !== ups.status) {
        // Check if notifications are enabled for this status change
        if ((settings.batteryNotifications && 
             ups.status?.toLowerCase() === 'on battery' && 
             prevState.status?.toLowerCase() !== 'on battery') ||
            (settings.lowBatteryNotifications && 
             ups.status?.toLowerCase() === 'low battery' && 
             prevState.status?.toLowerCase() !== 'low battery') ||
            (ups.status?.toLowerCase() === 'online' && 
             prevState.status?.toLowerCase() !== 'online')) {
          
          // Create notification object
          const notification = {
            id: Date.now(),
            ups_id: ups.id,
            ups_name: ups.displayName || ups.name,
            status: ups.status,
            previous_status: prevState.status,
            timestamp: new Date().toISOString()
          };
          
          // Add to local notification history
          setNotificationHistory(prev => [notification, ...prev].slice(0, 100)); // Keep last 100 notifications
          setNotificationCount(prev => prev + 1);
          
          // Send notification to server
          sendNotification(notification);
        }
      }
      
      // Update previous state
      previousUpsStates.current[ups.id] = {
        status: ups.status,
        batteryCharge: ups.batteryCharge
      };
    });
  }, [upsSystems, settings.notifications, settings.batteryNotifications, settings.lowBatteryNotifications, settings.discordWebhookUrl, loading]);

  /**
   * Send notification to server
   * @param {Object} notification - Notification object
   */
  const sendNotification = async (notification) => {
    try {
      await axios.post('/api/notifications/ups-status', {
        ups_id: notification.ups_id,
        ups_name: notification.ups_name,
        status: notification.status,
        previous_status: notification.previous_status,
        discord_webhook_url: settings.discordWebhookUrl,
        slack_webhook_url: settings.slackWebhookUrl,
        email_notifications: settings.emailNotifications,
        email_recipients: settings.emailRecipients
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  /**
   * Clear notification history
   */
  const clearNotificationHistory = () => {
    setNotificationHistory([]);
    setNotificationCount(0);
  };

  /**
   * Fetch notification history from server
   */
  const fetchNotificationHistory = async () => {
    try {
      const response = await axios.get('/api/notifications/history');
      setNotificationHistory(response.data);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  return {
    notificationHistory,
    notificationCount,
    clearNotificationHistory,
    fetchNotificationHistory
  };
};
