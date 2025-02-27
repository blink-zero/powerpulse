/**
 * Formats an error message from various error types
 * @param {Error|Object|string} error - The error to format
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle axios error responses
  if (error.response) {
    return error.response.data?.message || 
           `Server error: ${error.response.status} ${error.response.statusText}`;
  }

  // Handle network errors
  if (error.request) {
    return 'Network error: Unable to connect to the server';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error.message) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred';
};

/**
 * Creates a standardized error object
 * @param {string} message - Error message
 * @param {string} [code] - Error code
 * @param {Object} [details] - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, code = 'ERROR', details = {}) => {
  return {
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Logs an error with consistent formatting
 * @param {string} context - Where the error occurred
 * @param {Error|Object|string} error - The error to log
 * @param {Object} [additionalInfo] - Additional information to log
 */
export const logError = (context, error, additionalInfo = {}) => {
  console.error(
    `[${new Date().toISOString()}] Error in ${context}:`,
    error,
    additionalInfo
  );
};
