import { useState, useEffect } from 'react';
import { fetchBatteryHistory, recordBatteryCharge } from '../services/batteryHistoryService';

/**
 * Custom hook for fetching and managing battery history data
 * @param {number|null} upsId - The ID of the UPS system to fetch history for
 * @param {number} timeFilter - Number of days to fetch history for (default: 3)
 * @returns {Object} - Battery history data and loading state
 */
export const useBatteryHistory = (upsId, timeFilter = 3) => {
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
    if (!upsId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the data
      const data = await fetchBatteryHistory(upsId, days);
      
      if (!data || data.length === 0) {
        setBatteryHistory({
          labels: [],
          datasets: [],
        });
        return;
      }
      
      // Sort the data by timestamp
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Format timestamps for display
      const formattedLabels = sortedData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      });
      
      // Extract charge percentages
      const charges = sortedData.map(item => item.charge_percent);
      
      // Create chart data
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
      setError('Failed to fetch battery history');
      
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
    fetchAndProcessData(currentTimeFilter);
  }, [upsId, currentTimeFilter]);

  return {
    batteryHistory,
    loading,
    error,
    recordCurrentCharge,
    refreshData: fetchAndProcessData,
    currentTimeFilter
  };
};
