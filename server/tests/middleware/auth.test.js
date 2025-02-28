const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/auth');

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request, response, and next function mocks
    req = {
      header: jest.fn()
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  it('should return 401 if no token is provided', () => {
    // Setup request to return no token
    req.header.mockReturnValue(null);
    
    // Call the middleware
    authMiddleware(req, res, next);
    
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
      throw new Error('Invalid token');
    });
    
    // Call the middleware
    authMiddleware(req, res, next);
    
    // Check that the response is correct
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next if token is valid', () => {
    // Setup request to return a token
    req.header.mockReturnValue('Bearer validtoken');
    
    // Setup jwt.verify to return a decoded token
    const mockUser = { id: '123', username: 'testuser' };
    jwt.verify.mockReturnValue(mockUser);
    
    // Call the middleware
    authMiddleware(req, res, next);
    
    // Check that req.user is set and next is called
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should handle tokens with or without Bearer prefix', () => {
    // Test with Bearer prefix
    req.header.mockReturnValue('Bearer validtoken');
    const mockUser = { id: '123', username: 'testuser' };
    jwt.verify.mockReturnValue(mockUser);
    
    authMiddleware(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', process.env.JWT_SECRET);
    
    // Reset mocks
    jest.clearAllMocks();
    req.header.mockReturnValue('validtoken');
    
    // Test without Bearer prefix
    authMiddleware(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', process.env.JWT_SECRET);
  });

  it('should use the correct JWT_SECRET from environment variables', () => {
    // Save original process.env
    const originalEnv = process.env;
    
    // Set a test JWT_SECRET
    process.env.JWT_SECRET = 'test-secret';
    
    // Setup request to return a token
    req.header.mockReturnValue('Bearer validtoken');
    
    // Call the middleware
    authMiddleware(req, res, next);
    
    // Check that jwt.verify was called with the correct secret
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
    
    // Restore original process.env
    process.env = originalEnv;
  });
});
