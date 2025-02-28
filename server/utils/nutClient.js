const NUT = require('node-nut');

// Cache for NUT connections
const nutConnections = new Map();

// Get configuration from environment variables
const NUT_CONNECTION_TIMEOUT = parseInt(process.env.NUT_CONNECTION_TIMEOUT) || 5000;
const NUT_RETRY_ATTEMPTS = parseInt(process.env.NUT_RETRY_ATTEMPTS) || 3;
const NUT_RETRY_DELAY = parseInt(process.env.NUT_RETRY_DELAY) || 1000;

// Function to get a NUT client connection with retry logic
async function getNutClient(host, port, username, password) {
  const key = `${host}:${port}`;
  
  // Check if we already have a connection
  if (nutConnections.has(key)) {
    const existingClient = nutConnections.get(key);
    
    // Check if the connection is still valid
    if (existingClient._connected) {
      return existingClient;
    } else {
      console.log(`Existing NUT client for ${host}:${port} is disconnected, creating a new one`);
      nutConnections.delete(key);
    }
  }
  
  // Create a new connection with retry logic
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount < NUT_RETRY_ATTEMPTS) {
    try {
      // Create a new connection
      const client = new NUT(port, host, username, password);
      
      // Wrap the connection in a promise with timeout
      const connectionPromise = new Promise((resolve, reject) => {
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error(`Connection to NUT server at ${host}:${port} timed out after ${NUT_CONNECTION_TIMEOUT}ms`));
        }, NUT_CONNECTION_TIMEOUT);
        
        client.on('error', (err) => {
          clearTimeout(timeout);
          console.error(`NUT client error for ${host}:${port}:`, err);
          reject(err);
        });
        
        client.on('ready', () => {
          clearTimeout(timeout);
          console.log(`NUT client connected to ${host}:${port}`);
          nutConnections.set(key, client);
          resolve(client);
        });
        
        client.on('close', () => {
          console.log(`NUT client disconnected from ${host}:${port}`);
          nutConnections.delete(key);
        });
        
        client.start();
      });
      
      // Wait for the connection to be established
      return await connectionPromise;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount < NUT_RETRY_ATTEMPTS) {
        console.log(`Retrying connection to NUT server at ${host}:${port} (${retryCount}/${NUT_RETRY_ATTEMPTS})...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, NUT_RETRY_DELAY));
      }
    }
  }
  
  // If we've exhausted all retry attempts, throw the last error
  console.error(`Failed to connect to NUT server at ${host}:${port} after ${NUT_RETRY_ATTEMPTS} attempts`);
  throw lastError || new Error(`Failed to connect to NUT server at ${host}:${port}`);
}

// Function to get the list of UPS devices from a NUT server
async function getUpsListFromNutServer(host, port, username, password) {
  try {
    const client = await getNutClient(host, port, username, password);
    
    return new Promise((resolve, reject) => {
      client.GetUPSList((upslist, error) => {
        if (error) {
          reject(new Error(`Failed to get UPS list: ${error}`));
          return;
        }
        
        const upsList = Object.keys(upslist);
        resolve(upsList);
      });
    });
  } catch (error) {
    console.error(`Error getting UPS list from ${host}:${port}:`, error);
    throw error;
  }
}

// Function to get UPS variables from a NUT server
async function getUpsVariables(host, port, username, password, upsName) {
  try {
    const client = await getNutClient(host, port, username, password);
    
    // For UPS with "Other communication still running" error, we need to retry
    // with a delay to get the actual values
    const maxRetries = 3;
    let retryCount = 0;
    
    const getVariablesWithRetry = async () => {
      return new Promise((resolve, reject) => {
        client.GetUPSVars(upsName, (variables, error) => {
          if (error) {
            console.warn(`Warning getting UPS variables for ${upsName}: ${error}`);
            
            // Special case for "Other communication still running" error
            if (error.includes("Other communication still running") && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying (${retryCount}/${maxRetries}) to get variables for ${upsName}...`);
              
              // Wait a bit before retrying
              setTimeout(() => {
                getVariablesWithRetry().then(resolve).catch(reject);
              }, 500);
              return;
            }
            
            // For other errors or if max retries reached, resolve with an empty object
            resolve({});
            return;
          }
          
          // Check if we have essential variables
          if (!variables['ups.status']) {
            console.warn(`Warning: UPS ${upsName} is missing essential variables`);
            // Add a default status if missing
            variables['ups.status'] = 'OL';
          }
          
          resolve(variables);
        });
      });
    };
    
    return await getVariablesWithRetry();
  } catch (error) {
    console.error(`Error getting UPS variables for ${upsName} from ${host}:${port}:`, error);
    // Return empty object instead of throwing
    return {};
  }
}

// Function to connect to NUT server and get UPS data
async function getNutUpsData(host, port, username, password) {
  console.log(`Fetching UPS data from NUT server at ${host}:${port}`);
  
  try {
    // Get the list of UPS devices
    const upsList = await getUpsListFromNutServer(host, port, username, password);
    
    // Get data for each UPS
    const upsDataPromises = upsList.map(async (upsName, index) => {
      try {
        const variables = await getUpsVariables(host, port, username, password, upsName);
        
        // Extract relevant data from variables
        const model = variables['device.model'] || 'Unknown';
        const brand = variables['device.mfr'] || 'Unknown'; // Manufacturer/brand
        const serial = variables['device.serial'] || 'Unknown'; // Serial number
        const status = variables['ups.status'] || 'Unknown';
        
        // Battery data
        const batteryCharge = parseFloat(variables['battery.charge'] || '0');
        const batteryVoltage = parseFloat(variables['battery.voltage'] || '0');
        const batteryChargeLow = parseFloat(variables['battery.charge.low'] || '0');
        const batteryChargeWarning = parseFloat(variables['battery.charge.warning'] || '0');
        const batteryMfrDate = variables['battery.mfr.date'] || 'Unknown';
        const batteryRuntime = parseFloat(variables['battery.runtime'] || '0');
        const batteryRuntimeLow = parseFloat(variables['battery.runtime.low'] || '0');
        const batteryType = variables['battery.type'] || 'Unknown';
        const batteryVoltageNominal = parseFloat(variables['battery.voltage.nominal'] || '0');
        
        // Device data
        const deviceMfr = variables['device.mfr'] || 'Unknown';
        const deviceModel = variables['device.model'] || 'Unknown';
        const deviceSerial = variables['device.serial'] || 'Unknown';
        const deviceType = variables['device.type'] || 'Unknown';
        
        // Driver data
        const driverName = variables['driver.name'] || 'Unknown';
        const driverParameterPollfreq = variables['driver.parameter.pollfreq'] || 'Unknown';
        const driverParameterPollinterval = variables['driver.parameter.pollinterval'] || 'Unknown';
        const driverParameterPort = variables['driver.parameter.port'] || 'Unknown';
        const driverParameterProductid = variables['driver.parameter.productid'] || 'Unknown';
        const driverParameterSerial = variables['driver.parameter.serial'] || 'Unknown';
        const driverParameterSynchronous = variables['driver.parameter.synchronous'] || 'Unknown';
        const driverParameterVendorid = variables['driver.parameter.vendorid'] || 'Unknown';
        const driverVersion = variables['driver.version'] || 'Unknown';
        const driverVersionData = variables['driver.version.data'] || 'Unknown';
        const driverVersionInternal = variables['driver.version.internal'] || 'Unknown';
        const driverVersionUsb = variables['driver.version.usb'] || 'Unknown';
        
        // Input/output data
        const inputVoltage = parseFloat(variables['input.voltage'] || '0');
        const inputVoltageNominal = parseFloat(variables['input.voltage.nominal'] || '0');
        const outputVoltage = parseFloat(variables['output.voltage'] || '0');
        
        // UPS data
        const upsBeeper = variables['ups.beeper.status'] || 'Unknown';
        const upsDelayShutdown = parseFloat(variables['ups.delay.shutdown'] || '0');
        const upsDelayStart = parseFloat(variables['ups.delay.start'] || '0');
        const load = parseFloat(variables['ups.load'] || '0');
        const upsMfr = variables['ups.mfr'] || 'Unknown';
        const upsModel = variables['ups.model'] || 'Unknown';
        const upsProductid = variables['ups.productid'] || 'Unknown';
        const upsRealpowerNominal = parseFloat(variables['ups.realpower.nominal'] || '0');
        const upsSerial = variables['ups.serial'] || 'Unknown';
        const upsStatus = variables['ups.status'] || 'Unknown';
        const upsTestResult = variables['ups.test.result'] || 'Unknown';
        const upsTimerShutdown = parseFloat(variables['ups.timer.shutdown'] || '0');
        const upsTimerStart = parseFloat(variables['ups.timer.start'] || '0');
        const upsVendorid = variables['ups.vendorid'] || 'Unknown';
        
        // Convert battery runtime from seconds to minutes
        const runtimeRemaining = batteryRuntime / 60;
        
        // Check if we have any variables
        if (Object.keys(variables).length === 0) {
          return {
            id: index + 1,
            name: upsName,
            displayName: upsName,
            model: 'Unknown',
            brand: 'Unknown',
            serial: 'Unknown',
            status: 'Unknown', // Show actual status as Unknown
            batteryCharge: null, // Use null to indicate no data
            batteryVoltage: null,
            inputVoltage: null,
            outputVoltage: null,
            runtimeRemaining: null,
            load: null,
            rawVariables: {} // Include empty raw variables
          };
        }
        
        // Translate NUT status codes to human-readable format
        let statusDisplay = status;
        
        // Common NUT status codes
        if (status.includes('OL')) {
          statusDisplay = 'Online';
        } else if (status.includes('OB')) {
          statusDisplay = 'On Battery';
        } else if (status.includes('LB')) {
          statusDisplay = 'Low Battery';
        } else if (status.includes('RB')) {
          statusDisplay = 'Replace Battery';
        } else if (status.includes('CHRG')) {
          statusDisplay = 'Charging';
        } else if (status.includes('DISCHRG')) {
          statusDisplay = 'Discharging';
        } else if (status.includes('BYPASS')) {
          statusDisplay = 'Bypass';
        } else if (status.includes('CAL')) {
          statusDisplay = 'Calibration';
        } else if (status.includes('OFF')) {
          statusDisplay = 'Off';
        } else if (status.includes('OVER')) {
          statusDisplay = 'Overload';
        } else if (status.includes('TRIM')) {
          statusDisplay = 'Trimming Voltage';
        } else if (status.includes('BOOST')) {
          statusDisplay = 'Boosting Voltage';
        } else if (status.includes('FSD')) {
          statusDisplay = 'Forced Shutdown';
        }
        
        // Create UPS data object with actual values
        const upsData = {
          id: index + 1,
          name: upsName,
          displayName: variables['ups.id'] || upsName,
          model: model || 'Unknown',
          brand: brand || 'Unknown',
          serial: serial || 'Unknown',
          status: statusDisplay,
          batteryCharge: isNaN(batteryCharge) ? null : Math.round(batteryCharge),
          batteryVoltage: isNaN(batteryVoltage) ? null : parseFloat(batteryVoltage.toFixed(1)),
          inputVoltage: isNaN(inputVoltage) ? null : parseFloat(inputVoltage.toFixed(1)),
          outputVoltage: isNaN(outputVoltage) ? null : parseFloat(outputVoltage.toFixed(1)),
          runtimeRemaining: isNaN(runtimeRemaining) ? null : Math.round(runtimeRemaining),
          load: isNaN(load) ? null : Math.round(load),
          
          // Extended details
          batteryDetails: {
            charge: isNaN(batteryCharge) ? null : Math.round(batteryCharge),
            chargeLow: isNaN(batteryChargeLow) ? null : Math.round(batteryChargeLow),
            chargeWarning: isNaN(batteryChargeWarning) ? null : Math.round(batteryChargeWarning),
            mfrDate: batteryMfrDate,
            runtime: isNaN(batteryRuntime) ? null : Math.round(batteryRuntime),
            runtimeLow: isNaN(batteryRuntimeLow) ? null : Math.round(batteryRuntimeLow),
            type: batteryType,
            voltage: isNaN(batteryVoltage) ? null : parseFloat(batteryVoltage.toFixed(1)),
            voltageNominal: isNaN(batteryVoltageNominal) ? null : parseFloat(batteryVoltageNominal.toFixed(1))
          },
          
          deviceDetails: {
            mfr: deviceMfr,
            model: deviceModel,
            serial: deviceSerial,
            type: deviceType
          },
          
          driverDetails: {
            name: driverName,
            parameterPollfreq: driverParameterPollfreq,
            parameterPollinterval: driverParameterPollinterval,
            parameterPort: driverParameterPort,
            parameterProductid: driverParameterProductid,
            parameterSerial: driverParameterSerial,
            parameterSynchronous: driverParameterSynchronous,
            parameterVendorid: driverParameterVendorid,
            version: driverVersion,
            versionData: driverVersionData,
            versionInternal: driverVersionInternal,
            versionUsb: driverVersionUsb
          },
          
          inputDetails: {
            voltage: isNaN(inputVoltage) ? null : parseFloat(inputVoltage.toFixed(1)),
            voltageNominal: isNaN(inputVoltageNominal) ? null : parseFloat(inputVoltageNominal.toFixed(1))
          },
          
          outputDetails: {
            voltage: isNaN(outputVoltage) ? null : parseFloat(outputVoltage.toFixed(1))
          },
          
          upsDetails: {
            beeperStatus: upsBeeper,
            delayShutdown: isNaN(upsDelayShutdown) ? null : Math.round(upsDelayShutdown),
            delayStart: isNaN(upsDelayStart) ? null : Math.round(upsDelayStart),
            load: isNaN(load) ? null : Math.round(load),
            mfr: upsMfr,
            model: upsModel,
            productid: upsProductid,
            realpowerNominal: isNaN(upsRealpowerNominal) ? null : Math.round(upsRealpowerNominal),
            serial: upsSerial,
            status: upsStatus,
            testResult: upsTestResult,
            timerShutdown: isNaN(upsTimerShutdown) ? null : Math.round(upsTimerShutdown),
            timerStart: isNaN(upsTimerStart) ? null : Math.round(upsTimerStart),
            vendorid: upsVendorid
          },
          
          // Store all raw variables for reference
          rawVariables: variables
        };
        
        // Only include temperature if available in the UPS data
        if (variables['ups.temperature']) {
          const temp = parseFloat(variables['ups.temperature']);
          if (!isNaN(temp)) {
            upsData.temperature = parseFloat(temp.toFixed(1));
            upsData.upsDetails.temperature = parseFloat(temp.toFixed(1));
          }
        }
        
        return upsData;
      } catch (error) {
        console.error(`Error getting data for UPS ${upsName}:`, error);
        
        // Return basic info with actual error status
        return {
          id: index + 1,
          name: upsName,
          displayName: upsName,
          model: 'Unknown',
          brand: 'Unknown',
          serial: 'Unknown',
          status: 'Error', // Show as Error
          batteryCharge: null,
          batteryVoltage: null,
          inputVoltage: null,
          outputVoltage: null,
          runtimeRemaining: null,
          load: null,
          error: error.message,
          rawVariables: {} // Include empty raw variables
        };
      }
    });
    
    const upsDataList = await Promise.all(upsDataPromises);
    return upsDataList;
  } catch (error) {
    console.error(`Error connecting to NUT server at ${host}:${port}:`, error);
    
    // Return empty array if there's an error
    return [];
  }
}

module.exports = {
  getNutClient,
  getUpsListFromNutServer,
  getUpsVariables,
  getNutUpsData
};
