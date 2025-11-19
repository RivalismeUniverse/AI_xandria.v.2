const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

// Strict rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: {
    success: false,
    error: 'Too many AI requests, please slow down.'
  }
});

// Battle-specific rate limiting
const battleLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 battle requests per 5 minutes
  message: {
    success: false,
    error: 'Too many battle requests, please wait a few minutes.'
  }
});

module.exports = {
  generalLimiter,
  aiLimiter,
  battleLimiter
};
