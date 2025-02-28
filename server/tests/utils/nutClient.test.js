const { describe, it, expect, jest, beforeEach } = require('@jest/globals');

// Mock the node-nut module
jest.mock('node-nut', () => {
  return jest.fn().mockImplementation(() => {
    return {
      start: jest.fn().mockImplementation((callback) => callback(null)),
      close: jest.fn().mockImplementation((callback) => callback(null)),
      GetUPSList: jest.fn(),
      GetUPSVars: jest.fn(),
      on: jest.fn()
    };
  });
});

// Import the module after mocking its dependencies
const nutClient = require('../../utils/nutClient');

describe('NUT Client Utilities', () => {
  let mockNut;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get the mocked constructor
    mockNut = require('node-nut');
  });

  describe('connectToNutServer', () => {
    it('should connect to a NUT server successfully', async () => {
      // Setup mock implementation for GetUPSList
      const mockUPSList = { 'ups1': 'UPS 1 Description', 'ups2': 'UPS 2 Description' };
      mockNut.mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback(null)),
        GetUPSList: jest.fn().mockImplementation((callback) => callback(null, mockUPSList)),
        close: jest.fn().mockImplementation((callback) => callback(null)),
        on: jest.fn()
      }));
      
      // Call the function
      const result = await nutClient.connectToNutServer('localhost', 3493);
      
      // Check that the NUT client was created with the correct parameters
      expect(mockNut).toHaveBeenCalledWith({
        host: 'localhost',
        port: 3493,
        username: undefined,
        password: undefined
      });
      
      // Check that the result contains the UPS list
      expect(result).toEqual({
        client: expect.any(Object),
        upsList: mockUPSList
      });
    });

    it('should handle connection errors', async () => {
      // Setup mock implementation to simulate a connection error
      mockNut.mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback(new Error('Connection failed'))),
        close: jest.fn(),
        on: jest.fn()
      }));
      
      // Call the function and expect it to throw
      await expect(nutClient.connectToNutServer('invalid-host', 3493))
        .rejects.toThrow('Connection failed');
    });

    it('should handle authentication when credentials are provided', async () => {
      // Setup mock implementation
      mockNut.mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback(null)),
        GetUPSList: jest.fn().mockImplementation((callback) => callback(null, {})),
        close: jest.fn().mockImplementation((callback) => callback(null)),
        on: jest.fn()
      }));
      
      // Call the function with credentials
      await nutClient.connectToNutServer('localhost', 3493, 'username', 'password');
      
      // Check that the NUT client was created with the correct parameters
      expect(mockNut).toHaveBeenCalledWith({
        host: 'localhost',
        port: 3493,
        username: 'username',
        password: 'password'
      });
    });
  });

  describe('getUpsVariables', () => {
    it('should retrieve UPS variables successfully', async () => {
      // Setup mock implementation for GetUPSVars
      const mockUPSVars = {
        'battery.charge': '100',
        'battery.voltage': '13.5',
        'ups.status': 'OL',
        'ups.load': '25'
      };
      
      mockNut.mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback(null)),
        GetUPSVars: jest.fn().mockImplementation((upsName, callback) => callback(null, mockUPSVars)),
        close: jest.fn().mockImplementation((callback) => callback(null)),
        on: jest.fn()
      }));
      
      // Call the function
      const result = await nutClient.getUpsVariables('localhost', 3493, 'ups1');
      
      // Check that the result contains the UPS variables
      expect(result).toEqual({
        batteryCharge: 100,
        batteryVoltage: 13.5,
        status: 'OL',
        load: 25,
        // ... other processed variables
      });
    });

    it('should handle errors when retrieving UPS variables', async () => {
      // Setup mock implementation to simulate an error
      mockNut.mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback(null)),
        GetUPSVars: jest.fn().mockImplementation((upsName, callback) => 
          callback(new Error('Failed to get UPS variables'))),
        close: jest.fn().mockImplementation((callback) => callback(null)),
        on: jest.fn()
      }));
      
      // Call the function and expect it to throw
      await expect(nutClient.getUpsVariables('localhost', 3493, 'ups1'))
        .rejects.toThrow('Failed to get UPS variables');
    });
  });

  describe('closeNutConnection', () => {
    it('should close the NUT connection successfully', async () => {
      // Setup mock client
      const mockClient = {
        close: jest.fn().mockImplementation((callback) => callback(null))
      };
      
      // Call the function
      await nutClient.closeNutConnection(mockClient);
      
      // Check that close was called
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle errors when closing the connection', async () => {
      // Setup mock client with an error
      const mockClient = {
        close: jest.fn().mockImplementation((callback) => 
          callback(new Error('Failed to close connection')))
      };
      
      // Call the function and expect it to throw
      await expect(nutClient.closeNutConnection(mockClient))
        .rejects.toThrow('Failed to close connection');
    });
  });
});
