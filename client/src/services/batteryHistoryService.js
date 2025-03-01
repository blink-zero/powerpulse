import axios from 'axios';

/**
 * Fetches battery history data for a specific UPS system
 * @param {number} upsId - The ID of the UPS system
 * @param {number} days - Number of days of history to fetch (default: 7)
 * @returns {Promise<Array>} - Array of battery history records
 */
export const fetchBatteryHistory = async (upsId, days = 7) => {
  try {
    // Try the standard endpoint first
    try {
      const response = await axios.get(`/api/ups/systems/${upsId}/battery`);
      console.log('Battery history from standard endpoint:', response.data);
      return response.data;
    } catch (err) {
      console.warn('Standard endpoint failed:', err.message);
      
      // Try alternative endpoint
      try {
        const response = await axios.get(`/api/ups/${upsId}/battery-history`);
        console.log('Battery history from alternative endpoint:', response.data);
        return response.data;
      } catch (altErr) {
        console.warn('Alternative endpoint failed:', altErr.message);
        
      // Try a direct database query using our debug endpoint
      try {
        const response = await axios.get(`/api/debug/battery-history/${upsId}?days=${days}`);
          console.log('Battery history from debug endpoint:', response.data);
          
          // If we got data, return it
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data;
          }
          
          // If we didn't get data, try to check if the table exists and has records
          try {
            const tablesResponse = await axios.get('/api/debug/tables');
            console.log('Database tables:', tablesResponse.data);
            
            // Check if battery_history table exists
            const hasBatteryHistoryTable = tablesResponse.data.some(
              table => table.name === 'battery_history'
            );
            
            if (hasBatteryHistoryTable) {
              // Check how many records are in the table
              const countResponse = await axios.get('/api/debug/count/battery_history');
              console.log('Battery history count:', countResponse.data);
              
              if (countResponse.data && countResponse.data.count > 0) {
                console.log(`Table has ${countResponse.data.count} records but none for this UPS`);
              }
            }
          } catch (tableErr) {
            console.warn('Error checking tables:', tableErr.message);
          }
          
          // If we still don't have data, manually record the current battery charge
          try {
            // Get the current UPS data
            const upsResponse = await axios.get(`/api/ups/systems/${upsId}`);
            if (upsResponse.data && upsResponse.data.batteryCharge) {
              const charge = upsResponse.data.batteryCharge;
              console.log(`Manually recording current battery charge: ${charge}%`);
              
              // Record the current charge
              const recordResponse = await axios.post(
                `/api/debug/record-battery/${upsId}/${charge}`
              );
              console.log('Manual recording response:', recordResponse.data);
              
              // Try to fetch the data again
              const retryResponse = await axios.get(`/api/debug/battery-history/${upsId}?days=${days}`);
              console.log('Battery history after manual recording:', retryResponse.data);
              return retryResponse.data;
            }
          } catch (recordErr) {
            console.warn('Error recording battery charge:', recordErr.message);
          }
          
          // If all else fails, return empty array
          return [];
        } catch (debugErr) {
          console.error('All endpoints failed:', debugErr.message);
          throw new Error('Could not fetch battery history data');
        }
      }
    }
  } catch (error) {
    console.error('Error fetching battery history:', error);
    throw error;
  }
};

/**
 * Manually records a battery charge entry for a UPS system
 * @param {number} upsId - The ID of the UPS system
 * @param {number} chargePercent - The battery charge percentage
 * @returns {Promise<Object>} - The created record
 */
export const recordBatteryCharge = async (upsId, chargePercent) => {
  try {
    const response = await axios.post(`/api/ups/systems/${upsId}/battery`, {
      chargePercent
    });
    return response.data;
  } catch (error) {
    console.error('Error recording battery charge:', error);
    throw error;
  }
};
