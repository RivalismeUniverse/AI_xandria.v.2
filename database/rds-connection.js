import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// RDS Connection Configuration
const rdsConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Connection pool settings
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000
  },

  // SSL configuration for production
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},

  // Timezone configuration
  timezone: '+00:00'
};

// Create Sequelize instance
const sequelize = new Sequelize(
  rdsConfig.database,
  rdsConfig.username,
  rdsConfig.password,
  {
    host: rdsConfig.host,
    port: rdsConfig.port,
    dialect: rdsConfig.dialect,
    logging: rdsConfig.logging,
    pool: rdsConfig.pool,
    dialectOptions: rdsConfig.dialOptions,
    timezone: rdsConfig.timezone
  }
);

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Amazon RDS PostgreSQL connection established successfully.');
    
    // Log connection info (without password)
    console.log(`📊 Database: ${rdsConfig.database}`);
    console.log(`🌐 Host: ${rdsConfig.host}:${rdsConfig.port}`);
    console.log(`👤 User: ${rdsConfig.username}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to Amazon RDS:', error.message);
    
    // Provide helpful error messages
    if (error.original) {
      switch (error.original.code) {
        case 'ECONNREFUSED':
          console.error('💡 Check if RDS instance is running and accessible');
          break;
        case '28000':
          console.error('💡 Check database username and password');
          break;
        case '3D000':
          console.error('💡 Check if database exists: ' + rdsConfig.database);
          break;
        default:
          console.error('💡 Check RDS security groups and network access');
      }
    }
    
    return false;
  }
};

// Sync database (for development)
export const syncDatabase = async (force = false) => {
  try {
    if (process.env.NODE_ENV === 'production' && force) {
      console.warn('⚠️  Force sync disabled in production');
      return;
    }

    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

// Health check with detailed metrics
export const healthCheck = async () => {
  try {
    // Test basic connection
    await sequelize.authenticate();
    
    // Get database size and stats
    const [results] = await sequelize.query(`
      SELECT 
        current_database() as database,
        version() as version,
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM personas) as persona_count,
        (SELECT count(*) FROM users) as user_count,
        (SELECT count(*) FROM battles) as battle_count
    `);
    
    const stats = results[0];
    
    return {
      status: 'healthy',
      database: stats.database,
      version: stats.version.split(' ')[1], // Extract version number
      size_mb: Math.round(stats.size_bytes / 1024 / 1024),
      stats: {
        personas: parseInt(stats.persona_count),
        users: parseInt(stats.user_count),
        battles: parseInt(stats.battle_count)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Export the sequelize instance
export default sequelize;
