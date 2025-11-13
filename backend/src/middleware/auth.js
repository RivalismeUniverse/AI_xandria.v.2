// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication middleware using JWT
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.walletAddress = user.wallet_address;

    logger.debug('User authenticated', {
      userId: user.id,
      wallet: user.wallet_address
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: error.message 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please login again' 
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error' 
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (user) {
      req.user = user;
      req.userId = user.id;
      req.walletAddress = user.wallet_address;
    }

    next();
  } catch (error) {
    // Silent fail - continue without auth
    next();
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify wallet signature
 */
const verifySignature = (message, signature, address) => {
  // ethers v6 exports verifyMessage directly; to be compatible with v5/v6 we try both
  try {
    const ethers = require('ethers');

    // Prefer direct function if available
    if (typeof ethers.verifyMessage === 'function') {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    }

    // Otherwise use Wallet to recover (works for multiple ethers versions)
    if (ethers.utils && typeof ethers.utils.verifyMessage === 'function') {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    }

    // fallback: try Wallet
    if (ethers.Wallet && typeof ethers.Wallet.recover === 'function') {
      const recoveredAddress = ethers.Wallet.recover(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    }

    logger.error('verifySignature: ethers API not compatible with this runtime');
    return false;
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * EXPORTS
 *
 * - module.exports = auth
 *   so `const auth = require('../middleware/auth')` returns a function (works with existing routes)
 *
 * - also attach named exports for backwards compatibility
 */
module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.generateToken = generateToken;
module.exports.verifySignature = verifySignature;
