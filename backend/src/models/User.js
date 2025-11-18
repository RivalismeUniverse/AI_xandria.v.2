const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wallet_address: {
    type: DataTypes.STRING(42),
    allowNull: false,
    unique: true,
    validate: {
      isEthereumAddress: true
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  total_earnings: {
    type: DataTypes.DECIMAL(15, 6),
    defaultValue: 0
  },
  total_spent: {
    type: DataTypes.DECIMAL(15, 6),
    defaultValue: 0
  },
  persona_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  battle_participations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reputation_score: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0
  },
  last_active: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  indexes: [
    {
      fields: ['wallet_address']
    },
    {
      fields: ['reputation_score']
    }
  ]
});

module.exports = User;
