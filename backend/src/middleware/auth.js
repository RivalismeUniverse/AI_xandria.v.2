const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.walletAddress = decoded.walletAddress;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    logger.error('Auth Middleware Error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

module.exports = auth;
