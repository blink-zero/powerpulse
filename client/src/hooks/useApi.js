import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @param {boolean} immediate - Whether to call the API immediately
 * @param {any} initialData - Initial data state
 * @returns {Object} - { data, loading, error, execute, setData }
 */
export function useApi(apiFunction, immediate = true, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...params);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}

/**
 * Custom hook for polling API calls at regular intervals
 * @param {Function} apiFunction - The API function to call
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {any} initialData - Initial data state
 * @returns {Object} - { data, loading, error, execute, setData }
 */
export function usePollingApi(apiFunction, intervalMs = 5000, initialData = null) {
  const { data, loading, error, execute, setData } = useApi(apiFunction, true, initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      execute();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [execute, intervalMs]);

  return { data, loading, error, execute, setData };
}
