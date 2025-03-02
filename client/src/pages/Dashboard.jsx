import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import { FiBattery, FiAlertCircle, FiClock, FiThermometer, FiPercent, FiZap, FiActivity, FiRefreshCw, FiCalendar, FiFilter } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { useBatteryHistory } from '../hooks/useBatteryHistory';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register the Filler plugin for the 'fill' option
);

const Dashboard = () => {
  const { getPollIntervalMs, settings } = useSettings();
  // Define reducer for dashboard state
  const initialState = {
    upsSystems: [],
    loading: true,
    error: null,
    selectedUpsId: null,
    lastUpdated: new Date(),
    forceUpdate: 0 // Used to force re-renders
  };

  const dashboardReducer = (state, action) => {
    switch (action.type) {
      case 'SET_UPS_SYSTEMS':
        return {
          ...state,
          upsSystems: action.payload,
          lastUpdated: new Date(),
          forceUpdate: state.forceUpdate + 1 // Increment to force re-render
        };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      case 'SET_SELECTED_UPS_ID':
        return { ...state, selectedUpsId: action.payload };
      default:
        return state;
    }
  };

  // Use reducer instead of multiple useState calls
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { upsSystems, loading, error, selectedUpsId, lastUpdated, forceUpdate } = state;

  // Get the selected UPS from the current state
  const selectedUps = upsSystems.find(ups => ups.id === selectedUpsId) || null;
  
  const [timeFilter, setTimeFilter] = useState(3); // Default to 3 days
  
  const { 
    batteryHistory, 
    loading: historyLoading, 
    error: historyError,
    recordCurrentCharge,
    refreshData: refreshBatteryHistory,
    currentTimeFilter
  } = useBatteryHistory(selectedUps?.id, timeFilter);

  // Effect for fetching UPS systems data
  useEffect(() => {
    const fetchUpsSystems = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await axios.get('/api/ups/systems');
        const data = response.data;
        
        // Set initial selection if needed
        if (data.length > 0 && !selectedUpsId) {
          dispatch({ type: 'SET_SELECTED_UPS_ID', payload: data[0].id });
        }
        
        dispatch({ type: 'SET_UPS_SYSTEMS', payload: data });
        
        // Log for debugging
        console.log('UPS systems data fetched:', data);
      } catch (err) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to fetch UPS systems. Please check your connection to the NUT server.' 
        });
        console.error('Error fetching UPS systems:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchUpsSystems();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchUpsSystems, getPollIntervalMs());
    
    return () => clearInterval(interval);
  }, [getPollIntervalMs, selectedUpsId]); // Added selectedUpsId back to ensure proper initial selection

  const handleUpsSelect = (ups) => {
    dispatch({ type: 'SET_SELECTED_UPS_ID', payload: ups.id });
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

  const getBatteryLevelColor = (level) => {
    if (level >= 75) {
      return 'text-green-500';
    } else if (level >= 50) {
      return 'text-blue-500';
    } else if (level >= 25) {
      return 'text-yellow-500';
    } else {
      return 'text-red-500';
    }
  };

  // Format a date for display in the chart
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && upsSystems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading UPS systems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 m-4">
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
    );
  }

  if (upsSystems.length === 0) {
    return (
      <div className="text-center py-12">
        <FiBattery className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No UPS Systems Found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No UPS systems were detected from your NUT server.
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Configure NUT Server
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">UPS Monitoring Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <FiClock className="mr-1" />
          Last updated: {lastUpdated.toLocaleTimeString()}
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
            (Polling every {settings.pollInterval}s)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* UPS Systems List */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">UPS Systems</h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {upsSystems.map((ups, index) => (
                <li key={ups.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleUpsSelect(ups)}
                      className={`w-full px-4 py-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                        selectedUps?.id === ups.id ? 'bg-gray-50 dark:bg-gray-700' : ''
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
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Selected UPS Details */}
        <div className="md:col-span-2">
          {selectedUps && (
            <div className="space-y-6" key={`${selectedUps.id}-${selectedUps.batteryCharge}-${forceUpdate}`}>
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {selectedUps.displayName || selectedUps.name}
                    </h3>
                    {selectedUps.model && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Model: {selectedUps.model}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Brand: {selectedUps.deviceDetails?.mfr || selectedUps.brand || 'Unknown'} | Serial: {selectedUps.deviceDetails?.serial || selectedUps.serial || 'Unknown'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedUps.status
                    )}`}
                  >
                    {selectedUps.status}
                  </span>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Battery Charge */}
                    <div className="card">
                      <div className="flex items-center">
                        <FiBattery className="h-8 w-8 text-primary-600" />
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Battery Charge</h4>
                          <div className="mt-1 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedUps.batteryCharge}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            selectedUps.batteryCharge > 75
                              ? 'bg-green-500'
                              : selectedUps.batteryCharge > 50
                              ? 'bg-blue-500'
                              : selectedUps.batteryCharge > 25
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedUps.batteryCharge}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Battery Voltage */}
                    {selectedUps.batteryVoltage && (
                      <div className="card">
                        <div className="flex items-center">
                          <FiZap className="h-8 w-8 text-primary-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Battery Voltage</h4>
                            <div className="mt-1 flex items-baseline">
                              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedUps.batteryVoltage} V
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Runtime Remaining */}
                    <div className="card">
                      <div className="flex items-center">
                        <FiClock className="h-8 w-8 text-primary-600" />
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Runtime Remaining</h4>
                          <div className="mt-1 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {selectedUps.runtimeRemaining} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input Voltage */}
                    {selectedUps.inputVoltage && (
                      <div className="card">
                        <div className="flex items-center">
                          <FiZap className="h-8 w-8 text-primary-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Input Voltage</h4>
                            <div className="mt-1 flex items-baseline">
                              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedUps.inputVoltage} V
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Output Voltage */}
                    {selectedUps.outputVoltage && (
                      <div className="card">
                        <div className="flex items-center">
                          <FiZap className="h-8 w-8 text-primary-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Output Voltage</h4>
                            <div className="mt-1 flex items-baseline">
                              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedUps.outputVoltage} V
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Load */}
                    <div className="card">
                      <div className="flex items-center">
                        <FiZap className="h-8 w-8 text-primary-600" />
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Load</h4>
                          <div className="mt-1 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedUps.load}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Temperature */}
                    {selectedUps.temperature && (
                      <div className="card">
                        <div className="flex items-center">
                          <FiThermometer className="h-8 w-8 text-primary-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</h4>
                            <div className="mt-1 flex items-baseline">
                              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedUps.temperature}°C
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Battery History Chart */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Battery History
                    </h3>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <FiCalendar className="mr-1" />
                      Last {currentTimeFilter} days
                    </span>
                  </div>
                  <div className="flex items-center">
                    {/* Time filter dropdown */}
                    <div className="mr-4 relative">
                      <div className="flex items-center">
                        <FiFilter className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                        <select
                          value={timeFilter}
                          onChange={(e) => setTimeFilter(Number(e.target.value))}
                          className="text-sm bg-transparent border-none text-gray-500 dark:text-gray-400 focus:ring-0 focus:outline-none cursor-pointer pr-8"
                        >
                          <option value={1}>Last 24 hours</option>
                          <option value={3}>Last 3 days</option>
                        </select>
                      </div>
                    </div>
                    
                    {historyError && (
                      <span className="text-xs text-red-500 mr-2">{historyError}</span>
                    )}
                    <button 
                      onClick={() => refreshBatteryHistory()}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Refresh battery history"
                    >
                      <FiRefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="p-4 h-64">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading history...</p>
                      </div>
                    </div>
                  ) : batteryHistory.labels.length > 0 ? (
                    <Line
                      data={batteryHistory}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Battery Charge (%)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: `Time (Last ${currentTimeFilter} ${currentTimeFilter === 1 ? 'Day' : 'Days'})`
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">No history data available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
