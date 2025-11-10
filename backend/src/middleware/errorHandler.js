// backend/src/middleware/errorHandler.js
// Global error handling middleware
// Catches and formats errors consistently

const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (err, req) => {
  const response = {
    success: false,
    error: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  };

  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.path = req.path;
    response.method = req.method;
    response.timestamp = new Date().toISOString();
  }

  return response;
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    user: req.user?.wallet_address || 'anonymous'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new APIError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new APIError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new APIError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new APIError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new APIError(401, message);
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    const message = 'Duplicate entry. Resource already exists';
    error = new APIError(409, message);
  }

  if (err.code === '23503') {
    const message = 'Foreign key constraint violation';
    error = new APIError(400, message);
  }

  if (err.code === '22P02') {
    const message = 'Invalid input syntax';
    error = new APIError(400, message);
  }

  // Axios/HTTP errors
  if (err.isAxiosError) {
    const message = err.response?.data?.message || 'External API request failed';
    error = new APIError(err.response?.status || 500, message);
  }

  // Send error response
  res.status(error.statusCode || 500).json(formatErrorResponse(error, req));
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const message = `Route not found: ${req.originalUrl}`;
  logger.warn(message);
  
  res.status(404).json({
    success: false,
    error: message,
    statusCode: 404
  });
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 */
const validationErrorHandler = (errors) => {
  const formattedErrors = errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));

  return new APIError(400, 'Validation failed', true, JSON.stringify(formattedErrors));
};

/**
 * Database error handler
 */
const databaseErrorHandler = (err) => {
  logger.error('Database error:', err);

  if (err.code === 'ECONNREFUSED') {
    return new APIError(503, 'Database connection failed');
  }

  if (err.code === '42P01') {
    return new APIError(500, 'Database table does not exist');
  }

  return new APIError(500, 'Database operation failed');
};

/**
 * Blockchain error handler
 */
const blockchainErrorHandler = (err) => {
  logger.error('Blockchain error:', err);

  if (err.message.includes('insufficient funds')) {
    return new APIError(400, 'Insufficient funds for transaction');
  }

  if (err.message.includes('transaction failed')) {
    return new APIError(400, 'Blockchain transaction failed');
  }

  if (err.message.includes('network')) {
    return new APIError(503, 'Blockchain network unavailable');
  }

  return new APIError(500, 'Blockchain operation failed');
};

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req, res) => {
  logger.warn(`Rate limit exceeded for ${req.user?.wallet_address || req.ip}`);
  
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    statusCode: 429,
    retry_after: '60 seconds'
  });
};

/**
 * Operational error checker
 * Determines if error is operational (expected) or programming error
 */
const isOperationalError = (error) => {
  if (error instanceof APIError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Graceful shutdown on critical errors
 */
const handleCriticalError = (error) => {
  logger.error('Critical error occurred:', error);

  if (!isOperationalError(error)) {
    logger.error('Non-operational error detected. Shutting down...');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
  handleCriticalError(error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { reason, promise });
  handleCriticalError(reason);
});

module.exports = {
  APIError,
  errorHandler,
  notFound,
  asyncHandler,
  validationErrorHandler,
  databaseErrorHandler,
  blockchainErrorHandler,
  rateLimitHandler,
  isOperationalError,
  handleCriticalError
};
