/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password meets minimum requirements
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @param {number} [options.minLength=8] - Minimum password length
 * @param {boolean} [options.requireUppercase=true] - Require uppercase letter
 * @param {boolean} [options.requireLowercase=true] - Require lowercase letter
 * @param {boolean} [options.requireNumber=true] - Require number
 * @param {boolean} [options.requireSpecial=false] - Require special character
 * @returns {boolean} Whether the password is valid
 */
export const isValidPassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false
  } = options;

  if (!password || password.length < minLength) {
    return false;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return false;
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false;
  }

  return true;
};

/**
 * Validates a hostname or IP address
 * @param {string} host - Hostname or IP to validate
 * @returns {boolean} Whether the host is valid
 */
export const isValidHost = (host) => {
  // Simple hostname/IP validation
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  return hostnameRegex.test(host) || ipRegex.test(host);
};

/**
 * Validates a port number
 * @param {number|string} port - Port to validate
 * @returns {boolean} Whether the port is valid
 */
export const isValidPort = (port) => {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

/**
 * Creates validation rules for a form
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation functions
 */
export const createValidator = (rules) => {
  return {
    /**
     * Validates form data against rules
     * @param {Object} data - Form data to validate
     * @returns {Object} Validation result with errors
     */
    validate: (data) => {
      const errors = {};
      
      Object.entries(rules).forEach(([field, fieldRules]) => {
        const value = data[field];
        
        // Required check
        if (fieldRules.required && (!value && value !== 0)) {
          errors[field] = fieldRules.requiredMessage || `${field} is required`;
          return;
        }
        
        // Skip other validations if field is empty and not required
        if (!value && value !== 0) {
          return;
        }
        
        // Custom validator
        if (fieldRules.validator && typeof fieldRules.validator === 'function') {
          const isValid = fieldRules.validator(value, data);
          if (!isValid) {
            errors[field] = fieldRules.message || `${field} is invalid`;
          }
        }
        
        // Min length
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
          errors[field] = fieldRules.minLengthMessage || 
            `${field} must be at least ${fieldRules.minLength} characters`;
        }
        
        // Max length
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
          errors[field] = fieldRules.maxLengthMessage || 
            `${field} must be at most ${fieldRules.maxLength} characters`;
        }
        
        // Pattern
        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
          errors[field] = fieldRules.patternMessage || `${field} format is invalid`;
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
  };
};
