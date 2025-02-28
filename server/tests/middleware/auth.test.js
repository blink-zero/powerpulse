const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken');

// Import the module after mocking
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request, response, and next function mocks
    req = {
      header: jest.fn(),
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Setup jwt.verify mock
    jwt.verify = jest.fn();
  });

  it('should return 401 if no token is provided', () => {
    // Setup request to return no token
    req.header.mockReturnValue(null);

    // Call the middleware
    authenticateToken(req, res, next);

    // Check that the response is correct
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    // Setup request to return a token
    req.header.mockReturnValue('Bearer invalidtoken');

    // Setup jwt.verify to throw an error
    jwt.verify.mockImplementation(() => {
      throw { name: 'JsonWebTokenError' };
    });

    // Call the middleware
    authenticateToken(req, res, next);

    // Check that the response is correct
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid', error: 'invalid_token' });
    expect(next).not.toHaveBeenCalled();
  });
});
