// backend/src/utils/logger.js
// Winston logger configuration for AI_XANDRIA
// Handles logging to console and files

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston to use our custom colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports the logger should use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Create stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Add custom logging methods
logger.logRequest = (req, res, responseTime) => {
  logger.http(
    `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms - ${req.user?.wallet_address || 'anonymous'}`
  );
};

logger.logError = (error, req = null) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500
  };

  if (req) {
    errorLog.path = req.path;
    errorLog.method = req.method;
    errorLog.user = req.user?.wallet_address || 'anonymous';
    errorLog.ip = req.ip;
  }

  logger.error(JSON.stringify(errorLog));
};

logger.logBattle = (battleId, topic, persona1, persona2) => {
  logger.info(`Battle created: ${battleId} | ${topic} | ${persona1} vs ${persona2}`);
};

logger.logTransaction = (type, txHash, user, amount) => {
  logger.info(`Transaction: ${type} | ${txHash} | User: ${user} | Amount: ${amount}`);
};

logger.logEvolution = (personaId, changes) => {
  logger.info(`Persona evolved: ${personaId} | Changes: ${JSON.stringify(changes)}`);
};

logger.logNFTMint = (tokenId, personaId, owner) => {
  logger.info(`NFT minted: Token #${tokenId} | Persona: ${personaId} | Owner: ${owner}`);
};

logger.logChatUnlock = (personaId, user, amount) => {
  logger.info(`Chat unlocked: Persona ${personaId} | User: ${user} | Amount: ${amount}`);
};

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;
