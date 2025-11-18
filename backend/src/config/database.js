const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.RDS_DATABASE || 'ai_xandria',
  process.env.RDS_USERNAME || 'postgres',
  process.env.RDS_PASSWORD,
  {
    host: process.env.RDS_HOST || 'localhost',
    port: process.env.RDS_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

testConnection();

module.exports = sequelize;
