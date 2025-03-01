import axios from 'axios';

/**
 * Fetches battery history data for a specific UPS system
 * @param {number} upsId - The ID of the UPS system
 * @param {number} days - Number of days of history to fetch (default: 3)
 * @returns {Promise<Array>} - Array of battery history records
 */
export const fetchBatteryHistory = async (upsId, days = 3) => {
  try {
    // Use the debug endpoint which is most reliable
    const response = await axios.get(`/api/debug/battery-history/${upsId}?days=${days}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching battery history:', error);
    // Return empty array on error
    return [];
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
