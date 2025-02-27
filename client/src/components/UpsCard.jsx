import React from 'react';
import { FiBattery, FiActivity } from 'react-icons/fi';

/**
 * UPS Card component for displaying UPS system information
 * @param {Object} props - Component props
 * @param {Object} props.ups - UPS system data
 * @param {boolean} props.isSelected - Whether this UPS is selected
 * @param {Function} props.onClick - Click handler function
 */
const UpsCard = ({ ups, isSelected, onClick }) => {
  // Helper function to determine battery level color based on charge percentage
  const getBatteryLevelColor = (level) => {
    if (level >= 75) return 'text-green-500';
    if (level >= 50) return 'text-blue-500';
    if (level >= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Helper function to determine status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'on battery':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low battery':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <button
      onClick={() => onClick(ups)}
      className={`w-full px-4 py-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
        isSelected ? 'bg-gray-50 dark:bg-gray-700' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <FiBattery className={`mr-2 h-5 w-5 ${getBatteryLevelColor(ups.batteryCharge)}`} />
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {ups.displayName || ups.name}
          </p>
        </div>
        <div className="mt-1 flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              ups.status
            )}`}
          >
            {ups.status}
          </span>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {ups.batteryCharge}% charged
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <FiActivity className="mr-1" />
            {ups.load}%
          </span>
        </div>
      </div>
    </button>
  );
};

export default UpsCard;
