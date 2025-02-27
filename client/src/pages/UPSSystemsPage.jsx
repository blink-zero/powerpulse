import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiBattery, FiAlertCircle, FiServer, FiBell, FiClock } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../hooks/useNotifications';

const UPSSystemsPage = () => {
  const { settings, getPollIntervalMs } = useSettings();
  const [upsSystems, setUpsSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutServers, setNutServers] = useState([]);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const pollingInterval = useRef(null);
  
  // Use our custom notifications hook
  const { 
    notificationHistory, 
    notificationCount, 
    clearNotificationHistory, 
    fetchNotificationHistory 
  } = useNotifications(upsSystems, loading);

  // Initial data fetch
  useEffect(() => {
    fetchUpsSystems();
    fetchNutServers();
    fetchNotificationHistory();

    // Set up polling interval
    pollingInterval.current = setInterval(() => {
      fetchUpsSystems();
    }, getPollIntervalMs());

    // Clean up interval on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [getPollIntervalMs]);

  // Update polling interval when settings change
  useEffect(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(() => {
      fetchUpsSystems();
    }, getPollIntervalMs());
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [getPollIntervalMs]);

  const fetchUpsSystems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ups/systems');
      setUpsSystems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch UPS systems. Please try again later.');
      console.error('Error fetching UPS systems:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNutServers = async () => {
    try {
      const response = await axios.get('/api/nut/servers');
      setNutServers(response.data || []);
    } catch (err) {
      console.error('Error fetching NUT servers:', err);
    }
  };

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

  const getNutServerName = (nutServerId) => {
    const server = nutServers.find(server => server.id === nutServerId);
    return server ? `${server.host}:${server.port}` : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading UPS systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">UPS Systems</h1>
        
        {settings.notifications && (
          <button
            onClick={() => setShowNotificationHistory(!showNotificationHistory)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
          >
            <FiBell className="mr-2 -ml-1 h-4 w-4" />
            Notifications
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {notificationCount}
              </span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification History Panel */}
      {showNotificationHistory && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Notification History</h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchNotificationHistory}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiRefreshCw className="mr-2 -ml-1 h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={clearNotificationHistory}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiX className="mr-2 -ml-1 h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {notificationHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No notifications yet.</p>
            ) : (
              <div className="overflow-y-auto max-h-96">
                <ul className="space-y-4">
                  {notificationHistory.map((notification) => (
                    <li key={notification.id} className="border-l-4 pl-4 py-2" style={{ 
                      borderColor: notification.status?.toLowerCase() === 'online' 
                        ? '#10B981' 
                        : notification.status?.toLowerCase() === 'on battery'
                          ? '#F59E0B'
                          : notification.status?.toLowerCase() === 'low battery'
                            ? '#EF4444'
                            : '#6B7280'
                    }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.ups_name}: {notification.status}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Previous status: {notification.previous_status}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FiClock className="mr-1 h-3 w-3" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {upsSystems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <FiBattery className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No UPS Systems</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No UPS systems were detected from your NUT server.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  NUT Server
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Battery
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Load
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Runtime
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {upsSystems.map((ups, index) => (
                <tr key={ups.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiBattery className="h-5 w-5 text-primary-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ups.displayName || ups.name}
                        </div>
                        {ups.model && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ups.model}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiServer className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getNutServerName(ups.nutServerId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ups.status)}`}>
                      {ups.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{ups.batteryCharge}%</div>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          ups.batteryCharge > 75
                            ? 'bg-green-500'
                            : ups.batteryCharge > 50
                            ? 'bg-blue-500'
                            : ups.batteryCharge > 25
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${ups.batteryCharge}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ups.load}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ups.runtimeRemaining} min
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

export default UPSSystemsPage;
