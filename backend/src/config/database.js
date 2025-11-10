// backend/src/config/database.js
// PostgreSQL database connection configuration
// Uses pg library for Node.js

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aixandria',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  
  // SSL configuration (for production)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Create connection pool
const pool = new Pool(config);

// Pool error handler
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Pool connection handler
pool.on('connect', (client) => {
  logger.debug('New client connected to database');
});

// Pool removal handler
pool.on('remove', (client) => {
  logger.debug('Client removed from pool');
});

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connection successful', {
      timestamp: result.rows[0].now,
      host: config.host,
      database: config.database
    });
    
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

/**
 * Execute a query
 */
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Query error:', {
      text,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  try {
    const client = await pool.connect();
    
    // Add release handler
    const query = client.query;
    const release = client.release;
    
    // Set timeout for transaction
    const timeout = setTimeout(() => {
      logger.error('Client checkout timeout');
      client.release();
    }, 5000);
    
    // Override release to clear timeout
    client.release = () => {
      clearTimeout(timeout);
      client.release = release;
      return release.apply(client);
    };
    
    return client;
  } catch (error) {
    logger.error('Error getting client:', error);
    throw error;
  }
};

/**
 * Execute transaction
 */
const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    
    logger.debug('Transaction committed successfully');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create tables if they don't exist
 */
const initializeTables = async () => {
  try {
    logger.info('Initializing database tables...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        username VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create personas table
    await query(`
      CREATE TABLE IF NOT EXISTS personas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        personality JSONB NOT NULL,
        autonomy JSONB NOT NULL,
        memory JSONB,
        
        token_id INTEGER,
        contract_address VARCHAR(42),
        metadata_uri TEXT,
        owner_address VARCHAR(42) REFERENCES users(wallet_address),
        is_minted BOOLEAN DEFAULT FALSE,
        
        rating DECIMAL(3,2) DEFAULT 0,
        total_chats INTEGER DEFAULT 0,
        total_battles INTEGER DEFAULT 0,
        battle_wins INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create battles table
    await query(`
      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona1_id UUID REFERENCES personas(id),
        persona2_id UUID REFERENCES personas(id),
        topic VARCHAR(255) NOT NULL,
        
        persona1_argument TEXT,
        persona2_argument TEXT,
        
        winner_id UUID REFERENCES personas(id),
        status VARCHAR(20) DEFAULT 'active',
        
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    // Create battle_votes table
    await query(`
      CREATE TABLE IF NOT EXISTS battle_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        battle_id UUID REFERENCES battles(id),
        voter_address VARCHAR(42) NOT NULL,
        vote_for VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(battle_id, voter_address)
      )
    `);

    // Create chat_history table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona_id UUID REFERENCES personas(id),
        user_address VARCHAR(42) NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        sentiment_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create interactions table
    await query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona_id UUID REFERENCES personas(id),
        user_address VARCHAR(42) NOT NULL,
        tx_hash VARCHAR(66),
        amount_paid DECIMAL(20,8),
        status VARCHAR(20) DEFAULT 'pending',
        chat_unlocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create marketplace_listings table
    await query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona_id UUID REFERENCES personas(id),
        seller_address VARCHAR(42) NOT NULL,
        price DECIMAL(20,8) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        listed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create nft_sales table
    await query(`
      CREATE TABLE IF NOT EXISTS nft_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona_id UUID REFERENCES personas(id),
        token_id INTEGER NOT NULL,
        seller_address VARCHAR(42) NOT NULL,
        buyer_address VARCHAR(42) NOT NULL,
        price DECIMAL(20,8) NOT NULL,
        tx_hash VARCHAR(66),
        sold_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(owner_address)');
    await query('CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_chat_persona ON chat_history(persona_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_marketplace_active ON marketplace_listings(is_active)');

    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing tables:', error);
    throw error;
  }
};

/**
 * Close pool
 */
const close = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing pool:', error);
    throw error;
  }
};

/**
 * Get pool statistics
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
};

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  initializeTables,
  close,
  getPoolStats,
  pool
};
