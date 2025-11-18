const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Battle = sequelize.define('Battle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  topic: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  persona1_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'personas',
      key: 'id'
    }
  },
  persona2_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'personas',
      key: 'id'
    }
  },
  arguments: {
    type: DataTypes.JSONB,
    defaultValue: {
      persona1: [],
      persona2: []
    }
  },
  votes: {
    type: DataTypes.JSONB,
    defaultValue: {
      persona1: 0,
      persona2: 0
    }
  },
  winner_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  created_by: {
    type: DataTypes.STRING(42),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'battles',
  indexes: [
    {
      fields: ['persona1_id', 'persona2_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Battle;
