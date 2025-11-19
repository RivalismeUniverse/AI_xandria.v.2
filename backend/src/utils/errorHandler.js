const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Production error response
  else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message
      });
    } else {
      // Programming or unknown errors
      res.status(500).json({
        success: false,
        error: 'Something went wrong!'
      });
    }
  }
};

module.exports = {
  AppError,
  errorHandler
};
