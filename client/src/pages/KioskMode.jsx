import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import { FiBattery, FiAlertCircle, FiClock, FiZap, FiActivity, FiThermometer, FiGrid, FiList } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { useLocation, useNavigate } from 'react-router-dom';

// Disable inactivity timer for kiosk mode
const disableInactivityTimer = () => {
  // Clear any existing inactivity timer
  const existingTimer = localStorage.getItem('lastActivityTimestamp');
  if (existingTimer) {
    // Set the timestamp to the current time and keep updating it
    const updateTimestamp = () => {
      localStorage.setItem('lastActivityTimestamp', Date.now().toString());
    };
    
    // Update immediately and then every minute
    updateTimestamp();
    const intervalId = setInterval(updateTimestamp, 60000);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
  
  return () => {}; // No cleanup needed if no timer exists
};

// Dashboard reducer for state management
const initialState = {
  upsSystems: [],
  loading: true,
  error: null,
  currentUpsIndex: 0,
  lastUpdated: new Date(),
  forceUpdate: 0,
  multiView: false // Track whether we're showing multiple UPS systems at once
};

const kioskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_UPS_SYSTEMS':
      return {
        ...state,
        upsSystems: action.payload,
        lastUpdated: new Date(),
        forceUpdate: state.forceUpdate + 1
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'NEXT_UPS':
      return { 
        ...state, 
        currentUpsIndex: (state.currentUpsIndex + 1) % state.upsSystems.length 
      };
    case 'SET_CURRENT_UPS_INDEX':
      return {
        ...state,
        currentUpsIndex: action.payload
      };
    case 'TOGGLE_VIEW_MODE':
      return {
        ...state,
        multiView: !state.multiView
      };
    case 'SET_VIEW_MODE':
      return {
        ...state,
        multiView: action.payload
      };
    default:
      return state;
  }
};

const KioskMode = () => {
  const { getPollIntervalMs, settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL parameters to determine initial view mode and UPS filters
  const searchParams = new URLSearchParams(location.search);
  const initialMultiView = searchParams.get('multi') === 'true';
  const upsFilter = searchParams.get('ups'); // Comma-separated list of UPS IDs to show
  
  // Initialize state with URL parameters
  const [state, dispatch] = useReducer(kioskReducer, {
    ...initialState,
    multiView: initialMultiView
  });
  
  const { upsSystems: allUpsSystems, loading, error, currentUpsIndex, lastUpdated, forceUpdate, multiView } = state;
  
  // Filter UPS systems based on URL parameters
  const upsSystems = React.useMemo(() => {
    if (!upsFilter) return allUpsSystems;
    
    const upsIds = upsFilter.split(',');
    return allUpsSystems.filter(ups => upsIds.includes(ups.id.toString()));
  }, [allUpsSystems, upsFilter]);
  
  // Get the current UPS to display (only used in single view mode)
  const currentUps = upsSystems[currentUpsIndex] || null;
  
  // Toggle between multi-view and single-view modes
  const toggleViewMode = () => {
    const newMultiView = !multiView;
    dispatch({ type: 'SET_VIEW_MODE', payload: newMultiView });
    
    // Update URL to reflect the current view mode
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('multi', newMultiView.toString());
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };

  // Effect for fetching UPS systems data
  useEffect(() => {
    const fetchUpsSystems = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        // Use the non-authenticated kiosk endpoint
        const response = await axios.get('/api/ups/systems/kiosk');
        dispatch({ type: 'SET_UPS_SYSTEMS', payload: response.data });
      } catch (err) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to fetch UPS systems. Please check your connection to the NUT server.' 
        });
        console.error('Error fetching UPS systems for kiosk mode:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchUpsSystems();
    
    // Set up polling for real-time updates
    const dataInterval = setInterval(fetchUpsSystems, getPollIntervalMs());
    
    return () => clearInterval(dataInterval);
  }, [getPollIntervalMs]);

  // Disable inactivity timer for kiosk mode
  useEffect(() => {
    // This will keep updating the lastActivityTimestamp to prevent auto-logout
    const cleanup = disableInactivityTimer();
    return cleanup;
  }, []);

  // Auto-rotate between UPS systems every 10 seconds if there are multiple and not in multi-view mode
  useEffect(() => {
    if (upsSystems.length <= 1 || multiView) return;
    
    const rotationInterval = setInterval(() => {
      dispatch({ type: 'NEXT_UPS' });
    }, 10000); // 10 seconds
    
    return () => clearInterval(rotationInterval);
  }, [upsSystems.length, multiView]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-500';
      case 'on battery':
        return 'bg-yellow-500';
      case 'low battery':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBatteryLevelColor = (level) => {
    if (level >= 75) return 'bg-green-500';
    if (level >= 50) return 'bg-blue-500';
    if (level >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && upsSystems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className="mt-4 text-xl">Loading UPS systems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 max-w-md">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (upsSystems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 max-w-md">
          <FiBattery className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No UPS Systems Found</h3>
          <p className="text-gray-300">No UPS systems were detected from your NUT server.</p>
        </div>
      </div>
    );
  }

  // Render a single UPS card for multi-view mode
  const renderUpsCard = (ups) => {
    return (
      <div key={ups.id} className="bg-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">{ups.displayName || ups.name}</h3>
          <div className={`px-2 py-0.5 rounded-full ${getStatusColor(ups.status)} text-white text-xs font-medium`}>
            {ups.status}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Battery</span>
            <span className="text-xl font-bold">{ups.batteryCharge}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getBatteryLevelColor(ups.batteryCharge)}`}
              style={{ width: `${ups.batteryCharge}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-700 rounded-lg p-2">
            <div className="text-gray-400 mb-1">Runtime</div>
            <div className="font-semibold">{ups.runtimeRemaining} min</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-2">
            <div className="text-gray-400 mb-1">Load</div>
            <div className="font-semibold">{ups.load}%</div>
          </div>
          
          {ups.inputVoltage && (
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-gray-400 mb-1">Input</div>
              <div className="font-semibold">{ups.inputVoltage} V</div>
            </div>
          )}
          
          {ups.outputVoltage && (
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-gray-400 mb-1">Output</div>
              <div className="font-semibold">{ups.outputVoltage} V</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render a detailed view of a single UPS
  const renderSingleUpsView = () => {
    return (
      <>
        {/* Header with UPS name and status */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {currentUps.displayName || currentUps.name}
            </h1>
            {currentUps.model && (
              <p className="text-gray-400 text-sm">{currentUps.model}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className={`px-3 py-1 rounded-full ${getStatusColor(currentUps.status)} text-white font-medium`}>
              {currentUps.status}
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </header>

        {/* Main battery status */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center mb-4">
            <FiBattery className="h-8 w-8 text-primary-500 mr-3" />
            <h2 className="text-xl font-semibold">Battery Status</h2>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <div className="text-5xl font-bold mb-2 md:mb-0 md:mr-4">
              {currentUps.batteryCharge}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-4 mb-1">
                <div
                  className={`h-4 rounded-full ${getBatteryLevelColor(currentUps.batteryCharge)}`}
                  style={{ width: `${currentUps.batteryCharge}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiClock className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Runtime Remaining</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.runtimeRemaining} min</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiActivity className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Load</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.load}%</p>
            </div>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {currentUps.inputVoltage && (
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center mb-2">
                <FiZap className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Input Voltage</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.inputVoltage} V</p>
            </div>
          )}
          
          {currentUps.outputVoltage && (
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center mb-2">
                <FiZap className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Output Voltage</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.outputVoltage} V</p>
            </div>
          )}
          
          {currentUps.batteryVoltage && (
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center mb-2">
                <FiZap className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Battery Voltage</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.batteryVoltage} V</p>
            </div>
          )}
          
          {currentUps.temperature && (
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center mb-2">
                <FiThermometer className="h-5 w-5 text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-300">Temperature</h3>
              </div>
              <p className="text-2xl font-semibold">{currentUps.temperature}°C</p>
            </div>
          )}
        </div>

        {/* UPS selector dots (only if multiple UPS systems) */}
        {upsSystems.length > 1 && (
          <div className="flex justify-center mt-auto pt-4">
            {upsSystems.map((_, index) => (
              <button
                key={index}
                onClick={() => dispatch({ type: 'SET_CURRENT_UPS_INDEX', payload: index })}
                className={`h-3 w-3 rounded-full mx-1 ${
                  index === currentUpsIndex ? 'bg-primary-500' : 'bg-gray-600'
                }`}
                aria-label={`View UPS ${index + 1}`}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  // Render a grid of all UPS systems
  const renderMultiUpsView = () => {
    return (
      <>
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">UPS Systems Overview</h1>
          <p className="text-gray-400 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upsSystems.map(ups => renderUpsCard(ups))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* View mode toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleViewMode}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          title={multiView ? "Switch to single view" : "Switch to multi view"}
        >
          {multiView ? <FiList className="h-5 w-5" /> : <FiGrid className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Render either single view or multi view based on state */}
      {multiView ? renderMultiUpsView() : renderSingleUpsView()}
    </div>
  );
};

export default KioskMode;
