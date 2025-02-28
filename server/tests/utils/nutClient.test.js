const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock the node-nut module
jest.mock('node-nut');

// Import the module after mocking its dependencies
const nutClient = require('../../utils/nutClient');

describe('NUT Client Utilities', () => {
  let mockNut;
  let mockClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      start: jest.fn((callback) => callback(null)),
      close: jest.fn((callback) => callback(null)),
      GetUPSList: jest.fn((callback) => callback(null, { 'ups1': 'UPS 1 Description' })),
      GetUPSVars: jest.fn((upsName, callback) => callback(null, {
        'battery.charge': '100',
        'battery.voltage': '13.5',
        'ups.status': 'OL',
        'ups.load': '25'
      })),
      on: jest.fn(),
      _connected: true
    };

    // Mock the constructor
    mockNut = require('node-nut');
    mockNut.mockImplementation(() => mockClient);
  });

  describe('closeNutConnection', () => {
    it('should close the NUT connection successfully', async () => {
      // Setup mock client
      const mockClient = {
        close: jest.fn((callback) => callback(null))
      };

      // Call the function
      await nutClient.closeNutConnection(mockClient);

      // Check that close was called
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle errors when closing the connection', async () => {
      // Setup mock client with an error
      const mockClient = {
        close: jest.fn((callback) => callback(new Error('Failed to close connection')))
      };

      // Call the function and expect it to throw
      await expect(nutClient.closeNutConnection(mockClient))
        .rejects.toThrow('Failed to close connection');
    });
  });
});
