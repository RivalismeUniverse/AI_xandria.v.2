const winston = require('winston');
const { CloudWatchLogsClient, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

// Initialize CloudWatch client
const cloudWatchClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'ai-xandria-backend',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

/**
 * Send logs to AWS CloudWatch
 */
const sendToCloudWatch = async (logGroupName, logStreamName, message) => {
  if (process.env.NODE_ENV !== 'production') {
    return; // Only send to CloudWatch in production
  }

  try {
    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message: JSON.stringify(message),
          timestamp: Date.now()
        }
      ]
    };

    await cloudWatchClient.send(new PutLogEventsCommand(params));
  } catch (error) {
    // Fail silently - don't break app if CloudWatch fails
    console.error('CloudWatch logging failed:', error.message);
  }
};

/**
 * Log battle event to CloudWatch
 */
logger.logBattle = async (battleId, event, data) => {
  const message = {
    battleId,
    event,
    timestamp: new Date().toISOString(),
    ...data
  };

  logger.info(`Battle ${event}`, message);

  await sendToCloudWatch(
    '/ai-xandria/battles',
    `battle-${battleId}`,
    message
  );
};

/**
 * Log evolution event to CloudWatch
 */
logger.logEvolution = async (personaId, changes) => {
  const message = {
    personaId,
    changes,
    timestamp: new Date().toISOString()
  };

  logger.info('Persona evolution', message);

  await sendToCloudWatch(
    '/ai-xandria/evolution',
    `persona-${personaId}`,
    message
  );
};

/**
 * Log Bedrock API call
 */
logger.logBedrockCall = async (personaId, operation, tokens) => {
  const message = {
    personaId,
    operation,
    tokens,
    timestamp: new Date().toISOString()
  };

  logger.info('Bedrock API call', message);

  await sendToCloudWatch(
    '/ai-xandria/bedrock',
    'api-calls',
    message
  );
};

/**
 * Log payment transaction
 */
logger.logPayment = async (userId, personaId, amount, txHash) => {
  const message = {
    userId,
    personaId,
    amount,
    txHash,
    timestamp: new Date().toISOString()
  };

  logger.info('Payment processed', message);

  await sendToCloudWatch(
    '/ai-xandria/payments',
    'transactions',
    message
  );
};

module.exports = logger;
