/**
 * PowerPulse Test Setup
 * 
 * This script sets up the testing environment for PowerPulse.
 * It includes configuration for Jest, React Testing Library, and other testing utilities.
 */

// Import required testing libraries
const { configure } = require('@testing-library/react');
const { jest } = require('@jest/globals');

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
});

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch API
global.fetch = jest.fn();

// Mock NUT client
jest.mock('node-nut', () => {
  return class MockNUT {
    constructor() {
      this.start = jest.fn();
      this.GetUPSList = jest.fn();
      this.GetUPSVars = jest.fn();
      this.on = jest.fn((event, callback) => {
        if (event === 'ready') {
          setTimeout(callback, 0);
        }
      });
    }
  };
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  global.fetch.mockClear();
});

// Global test timeout
jest.setTimeout(10000);

// Console error and warning suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('Error:') ||
    args[0]?.includes?.('The above error occurred')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Restore console methods after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
