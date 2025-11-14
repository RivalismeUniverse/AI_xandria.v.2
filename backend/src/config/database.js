require('dotenv').config();

const config = {
  development: {
    username: process.env.RDS_USERNAME || 'postgres',
    password: process.env.RDS_PASSWORD || 'postgres',
    database: process.env.RDS_DATABASE || 'aixandria',
    host: process.env.RDS_HOST || 'localhost',
    port: process.env.RDS_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    username: 'postgres',
    password: 'postgres',
    database: 'aixandria_test',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
};

module.exports = config;
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
