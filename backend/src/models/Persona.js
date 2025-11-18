const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_address: {
    type: DataTypes.STRING(42),
    allowNull: false,
    validate: {
      isEthereumAddress: true
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prompt_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  traits: {
    type: DataTypes.JSONB,
    defaultValue: {
      intelligence: 50,
      creativity: 50,
      persuasiveness: 50,
      knowledge: 50,
      humor: 50
    }
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expertise: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  ipfs_hash: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  token_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  contract_address: {
    type: DataTypes.STRING(42),
    allowNull: true
  },
  is_rentable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rental_price: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0
  },
  battle_wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  battle_losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 5.0
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'personas',
  indexes: [
    {
      fields: ['owner_address']
    },
    {
      fields: ['token_id']
    },
    {
      fields: ['rating']
    }
  ]
});

module.exports = Persona;
