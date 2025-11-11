import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { logger } from '../utils/logger.js'

const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tagline: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      'content-creator',
      'academic',
      'tech',
      'mystical',
      'motivational',
      'special'
    ),
    allowNull: false
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  traits: {
    type: DataTypes.JSONB,
    defaultValue: {
      intelligence: 50,
      creativity: 50,
      persuasiveness: 50,
      empathy: 50,
      humor: 50,
      wisdom: 50
    }
  },
  expertise: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  backstory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  appearance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interactionStyle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#667eea'
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      rating: 0,
      totalInteractions: 0,
      battlesWon: 0,
      battlesLost: 0,
      chatSessions: 0,
      totalEarnings: 0
    }
  },
  abilities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  price: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 5.0000
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isNftMinted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nftTokenId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nftContractAddress: {
    type: DataTypes.STRING(42),
    allowNull: true
  },
  metadataUri: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creatorWallet: {
    type: DataTypes.STRING(42),
    allowNull: false,
    validate: {
      isEthereumAddress: true
    }
  },
  evolutionHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'personas',
  timestamps: true,
  hooks: {
    afterCreate: (persona) => {
      logger.info(`New persona created: ${persona.name} by ${persona.creatorWallet}`)
    }
  },
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['creatorWallet']
    },
    {
      fields: ['isPublic']
    },
    {
      fields: ['isNftMinted']
    },
    {
      fields: ['createdAt']
    }
  ]
})

// Instance methods
Persona.prototype.toJSON = function() {
  const values = { ...this.get() }
  // Remove sensitive fields
  delete values.creatorWallet
  delete values.updatedAt
  return values
}

Persona.prototype.updateStats = async function(updates) {
  const currentStats = this.stats || {}
  this.stats = { ...currentStats, ...updates }
  await this.save()
  return this.stats
}

Persona.prototype.addEvolution = async function(evolutionData) {
  const history = this.evolutionHistory || []
  history.push({
    timestamp: new Date().toISOString(),
    ...evolutionData
  })
  this.evolutionHistory = history
  await this.save()
}

Persona.prototype.getBattleReady = function() {
  return {
    id: this.id,
    name: this.name,
    tagline: this.tagline,
    personality: this.personality,
    traits: this.traits,
    expertise: this.expertise,
    stats: this.stats,
    abilities: this.abilities
  }
}

// Static methods
Persona.findByCreator = async function(walletAddress, options = {}) {
  return await this.findAll({
    where: { creatorWallet: walletAddress },
    ...options
  })
}

Persona.findPublic = async function(options = {}) {
  return await this.findAll({
    where: { isPublic: true },
    order: [['createdAt', 'DESC']],
    ...options
  })
}

Persona.findByCategory = async function(category, limit = 20) {
  return await this.findAll({
    where: { 
      category,
      isPublic: true 
    },
    order: [
      [sequelize.literal('("stats"->>\'rating\')::NUMERIC'), 'DESC NULLS LAST']
    ],
    limit: limit
  })
}

Persona.getTopRated = async function(limit = 10) {
  return await this.findAll({
    where: { isPublic: true },
    order: [
      [sequelize.literal('("stats"->>\'rating\')::NUMERIC'), 'DESC NULLS LAST']
    ],
    limit: limit
  })
}

Persona.search = async function(query, options = {}) {
  const { limit = 20, offset = 0 } = options
  
  return await this.findAll({
    where: {
      isPublic: true,
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.iLike]: `%${query}%` } },
        { tagline: { [sequelize.Op.iLike]: `%${query}%` } },
        { description: { [sequelize.Op.iLike]: `%${query}%` } },
        { expertise: { [sequelize.Op.contains]: [query] } }
      ]
    },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  })
}

// Associations will be defined in database configuration
export default Persona
