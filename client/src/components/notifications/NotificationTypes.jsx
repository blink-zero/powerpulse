import React from 'react';
import userSettingsService from '../../services/userSettingsService';

/**
 * Notification Types Component
 * 
 * This component handles the configuration of different notification types
 * (battery status, low battery, etc.). It's been extracted from the larger
 * NotificationSettings component to improve code organization and maintainability.
 */
const NotificationTypes = ({ 
  settings, 
  updateSetting, 
  notificationsEnabled 
}) => {
  return (
    <div className="border-t pt-4 dark:border-gray-700">
      <h5 className="text-sm font-medium text-gray-900 dark:text-white">Notification Types</h5>
      
      <div className="flex items-start mt-2">
        <div className="flex items-center h-5">
          <input
            id="batteryNotifications"
            name="batteryNotifications"
            type="checkbox"
            checked={settings.batteryNotifications !== false}
            onChange={async (e) => {
              console.log(`Updating Battery notifications to: ${e.target.checked}`);
              await updateSetting('batteryNotifications', e.target.checked);
              
              // Save the setting to the server immediately
              console.log('Battery notifications checkbox changed, saving to server');
              try {
                await userSettingsService.updateNotificationSettings({
                  ...settings,
                  batteryNotifications: e.target.checked
                });
                console.log('Saved battery notifications setting to server');
              } catch (error) {
                console.error('Error saving battery notifications setting to server:', error);
              }
            }}
            disabled={!notificationsEnabled}
            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
          />
        </div>
        <div className="ml-3 text-sm">
          <label 
            htmlFor="batteryNotifications" 
            className={`font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled ? 'opacity-50' : ''}`}
          >
            Battery status notifications
          </label>
          <p className={`text-gray-500 dark:text-gray-400 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
            Get notified when a UPS goes on battery power
          </p>
        </div>
      </div>
      
      <div className="flex items-start mt-2">
        <div className="flex items-center h-5">
          <input
            id="lowBatteryNotifications"
            name="lowBatteryNotifications"
            type="checkbox"
            checked={settings.lowBatteryNotifications !== false}
            onChange={async (e) => {
              console.log(`Updating Low Battery notifications to: ${e.target.checked}`);
              await updateSetting('lowBatteryNotifications', e.target.checked);
              
              // Save the setting to the server immediately
              console.log('Low battery notifications checkbox changed, saving to server');
              try {
                await userSettingsService.updateNotificationSettings({
                  ...settings,
                  lowBatteryNotifications: e.target.checked
                });
                console.log('Saved low battery notifications setting to server');
              } catch (error) {
                console.error('Error saving low battery notifications setting to server:', error);
              }
            }}
            disabled={!notificationsEnabled}
            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
          />
        </div>
        <div className="ml-3 text-sm">
          <label 
            htmlFor="lowBatteryNotifications" 
            className={`font-medium text-gray-700 dark:text-gray-300 ${!notificationsEnabled ? 'opacity-50' : ''}`}
          >
            Low battery notifications
          </label>
          <p className={`text-gray-500 dark:text-gray-400 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
            Get notified when a UPS battery is running low
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTypes;
