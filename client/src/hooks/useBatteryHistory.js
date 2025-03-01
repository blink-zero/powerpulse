import { useState, useEffect } from 'react';
import { fetchBatteryHistory, recordBatteryCharge } from '../services/batteryHistoryService';

/**
 * Custom hook for fetching and managing battery history data
 * @param {number|null} upsId - The ID of the UPS system to fetch history for
 * @param {number} timeFilter - Number of days to fetch history for (default: 7)
 * @returns {Object} - Battery history data and loading state
 */
export const useBatteryHistory = (upsId, timeFilter = 7) => {
  const [batteryHistory, setBatteryHistory] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTimeFilter, setCurrentTimeFilter] = useState(timeFilter);

  // Update the time filter when it changes
  useEffect(() => {
    setCurrentTimeFilter(timeFilter);
  }, [timeFilter]);

  // Function to fetch and process battery history data
  const fetchAndProcessData = async (days = currentTimeFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching battery history for UPS ${upsId} with time filter: ${days} days`);
      
      // Use our service to fetch the data
      const data = await fetchBatteryHistory(upsId, days);
      
      console.log(`Received ${data?.length || 0} data points for the last ${days} days`);
        
      if (!data || data.length === 0) {
        console.log('No battery history data available');
        setBatteryHistory({
          labels: [],
          datasets: [],
        });
        return;
      }
      
      console.log('Processing battery history data:', data);
      
      // Process the data for the chart
      // The API returns an array of objects with charge_percent and timestamp
      console.log('Raw data from API:', data);
      
      // Sort the data by timestamp
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log(`Sorted data: ${sortedData.length} records`);
      
      // Even though the server should filter the data, we'll also filter it on the client side
      // to ensure we only show data for the requested time period
      const now = new Date();
      const oldestAllowedDate = new Date(now);
      oldestAllowedDate.setDate(oldestAllowedDate.getDate() - days);
      console.log(`Client-side filtering: Only including records after ${oldestAllowedDate.toLocaleString()}`);
      
      // Filter the data to only include records within the requested time period
      const filteredData = sortedData.filter(item => {
        const timestamp = new Date(item.timestamp);
        return timestamp >= oldestAllowedDate;
      });
      
      console.log(`After client-side filtering: ${filteredData.length} records (was ${sortedData.length})`);
      
      // For multi-day views, ensure we get a good representation of the data across the full time range
      let finalData = filteredData;
      
      if (days > 1) {
        console.log(`Ensuring good data representation for ${days}-day view`);
        
        // Calculate the time range we want to cover (from now to N days ago)
        const now = new Date();
        const oldestAllowedDate = new Date(now);
        oldestAllowedDate.setDate(oldestAllowedDate.getDate() - days);
        
        // If we don't have data going back the full requested time range,
        // we'll work with what we have and distribute it evenly
        
        // Calculate how many data points we want per day (aim for about 12)
        const totalDesiredPoints = days * 12;
        
        if (filteredData.length > totalDesiredPoints) {
          // If we have more points than desired, sample them
          const samplingInterval = Math.max(1, Math.floor(filteredData.length / totalDesiredPoints));
          
          console.log(`Sampling interval: ${samplingInterval} (keeping 1 out of every ${samplingInterval} points)`);
          
          // Sample the data at regular intervals
          finalData = filteredData.filter((_, index) => index % samplingInterval === 0);
          
          // Always include the first and last points to ensure we cover the full time range
          if (finalData[0] !== filteredData[0]) {
            finalData.unshift(filteredData[0]);
          }
          if (finalData[finalData.length - 1] !== filteredData[filteredData.length - 1]) {
            finalData.push(filteredData[filteredData.length - 1]);
          }
          
          console.log(`After sampling: ${finalData.length} records (was ${filteredData.length})`);
        } else {
          // If we have fewer points than desired, use all of them
          console.log(`Using all ${filteredData.length} records (fewer than desired ${totalDesiredPoints})`);
          
          // If we have very few points, we might want to interpolate additional points
          // to get a smoother chart, but for now we'll just use what we have
        }
      }
      
      // Check if the data has the expected properties
      let timestamps, charges;
      
      if (finalData.length > 0 && !finalData[0].charge_percent) {
        console.warn('Data format issue: charge_percent not found in data');
        console.log('Data sample:', finalData[0]);
        
        // Try to detect the correct property names
        const sampleItem = finalData[0];
        const chargeKey = Object.keys(sampleItem).find(key => 
          key.includes('charge') || key.includes('battery') || 
          (typeof sampleItem[key] === 'number' && sampleItem[key] >= 0 && sampleItem[key] <= 100)
        );
        
        const timeKey = Object.keys(sampleItem).find(key => 
          key.includes('time') || key.includes('date') || 
          (typeof sampleItem[key] === 'string' && sampleItem[key].includes('T'))
        );
        
        if (chargeKey && timeKey) {
          console.log(`Using detected keys: ${chargeKey} for charge and ${timeKey} for timestamp`);
          timestamps = finalData.map(item => item[timeKey]);
          charges = finalData.map(item => item[chargeKey]);
        } else {
          console.error('Could not detect appropriate data keys');
          setBatteryHistory({
            labels: [],
            datasets: [],
          });
          return;
        }
      } else {
        timestamps = finalData.map(item => item.timestamp);
        charges = finalData.map(item => item.charge_percent);
      }
        
        // Store the original Date objects for logging
        const dateObjects = timestamps.map(ts => new Date(ts));
        
        // Format timestamps for better display
        const formattedLabels = dateObjects.map(date => {
          return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        });
        
        // Log the date range of the data
        if (dateObjects.length > 0) {
          const oldestDate = dateObjects[0];
          const newestDate = dateObjects[dateObjects.length - 1];
          console.log(`Data date range: ${oldestDate.toLocaleString()} to ${newestDate.toLocaleString()}`);
          
          // Calculate how many hours of data we have
          const hoursDiff = (newestDate - oldestDate) / (1000 * 60 * 60);
          console.log(`Data spans approximately ${hoursDiff.toFixed(1)} hours (${(hoursDiff / 24).toFixed(1)} days)`);
          
          // Check if the data matches the requested time filter
          const now = new Date();
          const requestedOldestDate = new Date(now);
          requestedOldestDate.setDate(requestedOldestDate.getDate() - days);
          console.log(`Requested date range: ${requestedOldestDate.toLocaleString()} to ${now.toLocaleString()}`);
          
          // Calculate the difference between the oldest date in the data and the requested oldest date
          const diffHours = (oldestDate - requestedOldestDate) / (1000 * 60 * 60);
          console.log(`Difference between requested and actual oldest date: ${diffHours.toFixed(1)} hours`);
          
          if (diffHours > 24) {
            console.warn(`Warning: Data does not go back as far as requested. Missing approximately ${diffHours.toFixed(1)} hours of data.`);
          }
        }
      
      setBatteryHistory({
        labels: formattedLabels,
        datasets: [
          {
            label: 'Battery Charge (%)',
            data: charges,
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.5)',
            tension: 0.3,
            fill: true,
          },
        ],
      });
    } catch (err) {
      console.error('Error fetching battery history:', err);
      setError(err.message || 'Failed to fetch battery history');
      
      // Set empty chart data on error
      setBatteryHistory({
        labels: [],
        datasets: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to manually record the current battery charge
  const recordCurrentCharge = async (currentCharge) => {
    if (!upsId || currentCharge === undefined || currentCharge === null) return;
    
    try {
      setLoading(true);
      await recordBatteryCharge(upsId, currentCharge);
      console.log(`Manually recorded battery charge: ${currentCharge}%`);
      
      // Refresh the data after recording
      await fetchAndProcessData();
    } catch (err) {
      console.error('Error recording battery charge:', err);
      setError('Failed to record battery charge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!upsId) return;
    fetchAndProcessData(currentTimeFilter);
  }, [upsId, currentTimeFilter]);

  return {
    batteryHistory,
    loading,
    error,
    recordCurrentCharge,
    refreshData: fetchAndProcessData,
    currentTimeFilter,
    setTimeFilter: setCurrentTimeFilter
  };
};
