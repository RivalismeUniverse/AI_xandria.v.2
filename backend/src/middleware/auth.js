// backend/src/middleware/auth.js
// Authentication middleware for protecting routes
// Verifies JWT tokens from wallet authentication

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const auth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authorization header provided' 
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        message: 'Authorization header must start with "Bearer "' 
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      user_id: decoded.user_id,
      wallet_address: decoded.wallet_address
    };

    // Log authentication
    logger.debug(`User authenticated: ${decoded.wallet_address}`);

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again' 
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication' 
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't reject if missing
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      user_id: decoded.user_id,
      wallet_address: decoded.wallet_address
    };

    logger.debug(`Optional auth: User ${decoded.wallet_address} authenticated`);
  } catch (error) {
    req.user = null;
    logger.debug('Optional auth: Token invalid or expired, continuing without auth');
  }

  next();
};

/**
 * Admin authentication middleware
 * Checks if user is an admin (for admin-only routes)
 */
const adminAuth = async (req, res, next) => {
  try {
    // First check regular authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      user_id: decoded.user_id,
      wallet_address: decoded.wallet_address
    };

    // Check if user is admin
    const ADMIN_ADDRESSES = (process.env.ADMIN_ADDRESSES || '').split(',').map(a => a.toLowerCase());

    if (!ADMIN_ADDRESSES.includes(decoded.wallet_address.toLowerCase())) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have permission to access this resource' 
      });
    }

    logger.info(`Admin authenticated: ${decoded.wallet_address}`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    logger.error('Admin authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Rate limiting authentication
 * Tracks requests per wallet address
 */
const rateLimitAuth = (maxRequests = 100, windowMs = 60000) => {
  const requestCounts = new Map();

  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        user_id: decoded.user_id,
        wallet_address: decoded.wallet_address
      };

      const walletAddress = decoded.wallet_address;
      const now = Date.now();

      // Get or create request record
      let record = requestCounts.get(walletAddress);
      
      if (!record) {
        record = { count: 0, startTime: now };
        requestCounts.set(walletAddress, record);
      }

      // Reset count if window has passed
      if (now - record.startTime > windowMs) {
        record.count = 0;
        record.startTime = now;
      }

      // Increment count
      record.count++;

      // Check if limit exceeded
      if (record.count > maxRequests) {
        const resetTime = new Date(record.startTime + windowMs);
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000}s`,
          reset_at: resetTime.toISOString()
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
      res.setHeader('X-RateLimit-Reset', new Date(record.startTime + windowMs).toISOString());

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      logger.error('Rate limit auth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};

/**
 * Wallet ownership verification
 * Verifies that the authenticated user owns the specified resource
 */
const verifyOwnership = (resourceField = 'owner_address') => {
  return (req, res, next) => {
    try {
      const userWallet = req.user.wallet_address;
      const resourceOwner = req.body[resourceField] || req.params[resourceField];

      if (!resourceOwner) {
        return res.status(400).json({ 
          error: 'Missing resource owner information' 
        });
      }

      if (userWallet.toLowerCase() !== resourceOwner.toLowerCase()) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You do not own this resource' 
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership verification error:', error);
      return res.status(500).json({ error: 'Verification failed' });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  rateLimitAuth,
  verifyOwnership
};
