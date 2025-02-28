import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiBattery, FiAlertCircle, FiServer, FiChevronDown, FiChevronUp, FiInfo, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../hooks/useNotifications';

// UPS Detail Card Component
const UpsDetailCard = ({ ups, nutServerName, onNicknameUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(ups.nickname || '');
  const [isSaving, setIsSaving] = useState(false);

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
    if (level >= 75) return 'bg-green-500';
    if (level >= 50) return 'bg-blue-500';
    if (level >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleNicknameEdit = () => {
    setIsEditingNickname(true);
  };

  const handleNicknameSave = async () => {
    try {
      setIsSaving(true);
      await axios.put(`/api/ups/systems/${ups.id}/nickname`, { nickname });
      setIsEditingNickname(false);
      if (onNicknameUpdate) {
        onNicknameUpdate(ups.id, nickname);
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
      // You could add error handling UI here
    } finally {
      setIsSaving(false);
    }
  };

  const handleNicknameCancel = () => {
    setNickname(ups.nickname || '');
    setIsEditingNickname(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* UPS Summary Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FiBattery className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              {isEditingNickname ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter nickname"
                    className="text-lg font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 mr-2"
                    autoFocus
                  />
                  <button
                    onClick={handleNicknameSave}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    {isSaving ? (
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-600 rounded-full"></div>
                    ) : (
                      <FiCheck className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleNicknameCancel}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {ups.displayName || ups.name}
                  </h3>
                  <button
                    onClick={handleNicknameEdit}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    title="Edit nickname"
                  >
                    <FiEdit2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center mt-1 space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ups.status)}`}>
                  {ups.status || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {ups.deviceDetails?.model || ups.model || 'Unknown Model'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <FiServer className="h-3 w-3 mr-1" />
                  {nutServerName}
                </span>
              </div>
              <div className="flex items-center mt-1 space-x-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Brand: {ups.deviceDetails?.mfr || ups.brand || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  S/N: {ups.deviceDetails?.serial || ups.serial || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Battery</div>
            <div className="mt-1 flex items-center">
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{ups.batteryCharge}%</div>
              <div className="ml-2 w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div
                  className={`h-2 rounded-full ${getBatteryLevelColor(ups.batteryCharge)}`}
                  style={{ width: `${ups.batteryCharge}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Load</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{ups.load}%</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Runtime</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{ups.runtimeRemaining} min</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Battery Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <FiBattery className="mr-2" /> Battery Details
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {ups.batteryDetails && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Charge</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.charge}%</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Charge Low</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.chargeLow}%</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Charge Warning</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.chargeWarning}%</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Manufacturer Date</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.mfrDate}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Runtime</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.runtime} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Runtime Low</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.runtimeLow} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Type</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.type}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Voltage</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.voltage} V</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Voltage Nominal</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.batteryDetails.voltageNominal} V</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Device Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <FiInfo className="mr-2" /> Device Details
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {ups.deviceDetails && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Manufacturer</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.deviceDetails.mfr}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Model</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.deviceDetails.model}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Serial</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.deviceDetails.serial}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Type</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.deviceDetails.type}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Input/Output Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <FiInfo className="mr-2" /> Input/Output Details
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {ups.inputDetails && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Input Voltage</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.inputDetails.voltage} V</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Input Voltage Nominal</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.inputDetails.voltageNominal} V</td>
                        </tr>
                      </>
                    )}
                    {ups.outputDetails && (
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Output Voltage</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.outputDetails.voltage} V</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UPS Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <FiInfo className="mr-2" /> UPS Details
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {ups.upsDetails && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Beeper Status</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.beeperStatus}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Delay Shutdown</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.delayShutdown} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Delay Start</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.delayStart} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Load</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.load}%</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Manufacturer</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.mfr}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Model</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.model}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Product ID</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.productid}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Realpower Nominal</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.realpowerNominal} W</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Serial</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.serial}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Status</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.status}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Test Result</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.testResult}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Timer Shutdown</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.timerShutdown} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Timer Start</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.timerStart} sec</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Vendor ID</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.upsDetails.vendorid}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Driver Details */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <FiInfo className="mr-2" /> Driver Details
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {ups.driverDetails && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Name</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.name}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Poll Frequency</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterPollfreq}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Poll Interval</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterPollinterval}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Port</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterPort}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Product ID</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterProductid}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Serial</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterSerial}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Synchronous</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterSynchronous}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Parameter Vendor ID</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.parameterVendorid}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Version</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.version}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Version Data</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.versionData}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Version Internal</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.versionInternal}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Version USB</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ups.driverDetails.versionUsb}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UPSSystemsPage = () => {
  const { settings, getPollIntervalMs } = useSettings();
  const [upsSystems, setUpsSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutServers, setNutServers] = useState([]);
  // Notification history panel removed as per user request
  const pollingInterval = useRef(null);
  
  // Still using notifications hook for background monitoring, but UI elements removed
  useNotifications(upsSystems, loading);

  // Initial data fetch
  useEffect(() => {
    fetchUpsSystems();
    fetchNutServers();

    // Set up polling interval - only for background monitoring, not UI updates
    pollingInterval.current = setInterval(() => {
      // Use a silent fetch that doesn't trigger loading state or UI updates
      silentFetchUpsSystems();
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
      // Use a silent fetch that doesn't trigger loading state or UI updates
      silentFetchUpsSystems();
    }, getPollIntervalMs());
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [getPollIntervalMs]);

  // Silent fetch function that doesn't trigger loading state
  const silentFetchUpsSystems = async () => {
    try {
      const response = await axios.get('/api/ups/systems');
      
      // Only update state if there are meaningful changes
      if (JSON.stringify(response.data) !== JSON.stringify(upsSystems)) {
        setUpsSystems(response.data);
      }
      
      if (error) {
        setError(null);
      }
    } catch (err) {
      console.error('Error silently fetching UPS systems:', err);
      // Don't update error state to avoid UI disruption
    }
  };

  // Regular fetch function with loading state - used for initial load and manual refreshes
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

      {/* Notification panel removed as per user request */}

      {upsSystems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <FiBattery className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No UPS Systems</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No UPS systems were detected from your NUT server.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upsSystems.map((ups, index) => (
            <UpsDetailCard 
              key={ups.id} 
              ups={ups} 
              nutServerName={getNutServerName(ups.nutServerId)}
              onNicknameUpdate={(id, nickname) => {
                // Update the UPS systems state with the new nickname
                setUpsSystems(prevSystems => 
                  prevSystems.map(system => 
                    system.id === id 
                      ? { 
                          ...system, 
                          nickname, 
                          displayName: nickname || system.name 
                        } 
                      : system
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UPSSystemsPage;
