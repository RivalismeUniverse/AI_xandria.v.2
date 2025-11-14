require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const personaRoutes = require('./routes/persona');
const battleRoutes = require('./routes/battle');
const chatRoutes = require('./routes/chat');
const nftRoutes = require('./routes/nft');
const walletRoutes = require('./routes/wallet');

// Middleware
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Database
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & CORS
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://aixandria.demo.amplifyapp.com']
    : ['http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/personas', personaRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/wallet', walletRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

// Database connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Sync models in development only
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
