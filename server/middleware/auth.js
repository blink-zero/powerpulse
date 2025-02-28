const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables with validation
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set.');
  console.error('This is a security risk. Please set JWT_SECRET in your .env file.');
  console.error('You can generate a secure random string with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

  // In production exit the process if JWT_SECRET is not set
  if (process.env.NODE_ENV === 'production') {
    console.error('Exiting process due to missing JWT_SECRET in production environment.');
    process.exit(1);
  } else {
    console.warn('Using fallback JWT_SECRET for development only. DO NOT USE IN PRODUCTION!');
  }
}

// Use a fallback only in development mode
const getJwtSecret = () => {
  if (JWT_SECRET) return JWT_SECRET;

  if (process.env.NODE_ENV !== 'production') {
    return 'powerpulse-dev-secret-key-do-not-use-in-production';
  }

  throw new Error('JWT_SECRET environment variable is required in production');
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Check for internal request first
  if (authenticateInternalRequest(req)) {
    // For internal requests set a system user
    req.user = {
      id: 0,
      username: 'system',
      role: 'system'
    };
    return next();
  }

  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const secret = getJwtSecret();
    const user = jwt.verify(token, secret);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: 'token_expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid', error: 'invalid_token' });
    } else {
      console.error('Authentication error:', err);
      return res.status(500).json({ message: 'Authentication error', error: 'auth_error' });
    }
  }
};

// Internal request authentication middleware
const authenticateInternalRequest = (req) => {
  const internalApiKey = req.headers['x-internal-request'];
  const validInternalKey = process.env.INTERNAL_API_KEY || 'powerpulse-internal';

  return internalApiKey === validInternalKey;
};

module.exports = {
  authenticateToken,
  authenticateInternalRequest,
  getJwtSecret
};
