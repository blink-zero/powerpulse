import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiAlertCircle, FiCheckCircle, FiBattery } from 'react-icons/fi';

/**
 * Notification History Component
 * 
 * This component displays the history of notifications sent to the user.
 * It's been created as a separate component to improve code organization
 * and maintainability.
 */
const NotificationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotificationHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/notifications/history');
        setHistory(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching notification history:', err);
        setError('Failed to load notification history');
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationHistory();
  }, []);

  // Helper function to get icon based on status
  const getStatusIcon = (status) => {
    if (status === 'Online') {
      return <FiCheckCircle className="text-green-500" />;
    } else if (status === 'On Battery') {
      return <FiBattery className="text-orange-500" />;
    } else if (status === 'Low Battery') {
      return <FiAlertCircle className="text-red-500" />;
    } else {
      return <FiClock className="text-gray-500" />;
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="border-t pt-4 dark:border-gray-700">
        <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <FiClock className="mr-2 h-4 w-4" />
          Notification History
        </h5>
        <div className="mt-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading notification history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t pt-4 dark:border-gray-700">
        <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <FiClock className="mr-2 h-4 w-4" />
          Notification History
        </h5>
        <div className="mt-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-4 dark:border-gray-700">
      <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
        <FiClock className="mr-2 h-4 w-4" />
        Notification History
      </h5>
      
      {history.length === 0 ? (
        <div className="mt-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">No notification history found</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  UPS
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Previous Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {history.map((notification) => (
                <tr key={notification.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(notification.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {notification.ups_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      {getStatusIcon(notification.status)}
                      <span className="ml-2">{notification.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {notification.previous_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
