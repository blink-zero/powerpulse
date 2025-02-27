import { useState, useEffect } from 'react';
import { fetchBatteryHistory, recordBatteryCharge } from '../services/batteryHistoryService';

/**
 * Custom hook for fetching and managing battery history data
 * @param {number|null} upsId - The ID of the UPS system to fetch history for
 * @returns {Object} - Battery history data and loading state
 */
export const useBatteryHistory = (upsId) => {
  const [batteryHistory, setBatteryHistory] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch and process battery history data
  const fetchAndProcessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use our service to fetch the data
      const data = await fetchBatteryHistory(upsId);
        
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
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Check if the data has the expected properties
      let timestamps, charges;
      
      if (sortedData.length > 0 && !sortedData[0].charge_percent) {
        console.warn('Data format issue: charge_percent not found in data');
        console.log('Data sample:', sortedData[0]);
        
        // Try to detect the correct property names
        const sampleItem = sortedData[0];
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
          timestamps = sortedData.map(item => item[timeKey]);
          charges = sortedData.map(item => item[chargeKey]);
        } else {
          console.error('Could not detect appropriate data keys');
          setBatteryHistory({
            labels: [],
            datasets: [],
          });
          return;
        }
      } else {
        timestamps = sortedData.map(item => item.timestamp);
        charges = sortedData.map(item => item.charge_percent);
      }
        
        // Format timestamps for better display in a 7-day view
        const formattedLabels = timestamps.map(ts => {
          const date = new Date(ts);
          return date.toISOString(); // Return ISO string for proper date handling in the chart
        });
      
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
    fetchAndProcessData();
  }, [upsId]);

  return {
    batteryHistory,
    loading,
    error,
    recordCurrentCharge,
    refreshData: fetchAndProcessData
  };
};
