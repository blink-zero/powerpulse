/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} [email] - Email address (optional)
 * @property {'admin' | 'user'} role - User role
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} NutServer
 * @property {number} id - Server ID
 * @property {string} host - Server hostname or IP
 * @property {number} port - Server port
 * @property {string} [username] - Username for authentication (optional)
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} UpsSystem
 * @property {number} id - UPS ID
 * @property {string} name - UPS name
 * @property {string} [displayName] - Display name (optional)
 * @property {string} upsName - UPS name in NUT
 * @property {number} nutServerId - Associated NUT server ID
 * @property {string} [model] - UPS model (optional)
 * @property {string} status - UPS status
 * @property {number|null} batteryCharge - Battery charge percentage
 * @property {number|null} [batteryVoltage] - Battery voltage (optional)
 * @property {number|null} [inputVoltage] - Input voltage (optional)
 * @property {number|null} [outputVoltage] - Output voltage (optional)
 * @property {number|null} runtimeRemaining - Runtime remaining in minutes
 * @property {number|null} load - Load percentage
 * @property {number|null} [temperature] - Temperature in Celsius (optional)
 */

/**
 * @typedef {Object} BatteryHistory
 * @property {number} id - History entry ID
 * @property {number} ups_id - UPS ID
 * @property {number} charge_percent - Battery charge percentage
 * @property {string} timestamp - Timestamp
 */

/**
 * @typedef {Object} ApiResponse
 * @property {string} message - Response message
 * @property {Object} [data] - Response data (optional)
 * @property {string} [error] - Error message (optional)
 */

// Export empty object since this is a JavaScript file with JSDoc types
export default {};
