import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { logger } from '../utils/logger.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletAddress: {
    type: DataTypes.STRING(42),
    allowNull: false,
    unique: true,
    validate: {
      isEthereumAddress: true
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      personasCreated: 0,
      battlesParticipated: 0,
      totalEarnings: 0,
      nftsOwned: 0
    }
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      theme: 'dark',
      language: 'en'
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    afterCreate: (user) => {
      logger.info(`New user created: ${user.walletAddress}`)
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['walletAddress']
    },
    {
      fields: ['username']
    },
    {
      fields: ['createdAt']
    }
  ]
})

// Instance methods
User.prototype.toJSON = function() {
  const values = { ...this.get() }
  delete values.createdAt
  delete values.updatedAt
  return values
}

User.prototype.updateStats = async function(updates) {
  const currentStats = this.stats || {}
  this.stats = { ...currentStats, ...updates }
  await this.save()
  return this.stats
}

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    walletAddress: this.walletAddress,
    username: this.username,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    stats: this.stats,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  }
}

// Static methods
User.findOrCreateByWallet = async function(walletAddress, userData = {}) {
  const [user, created] = await this.findOrCreate({
    where: { walletAddress },
    defaults: {
      walletAddress,
      ...userData
    }
  })

  if (created) {
    logger.info(`New user registered: ${walletAddress}`)
  } else {
    user.lastLogin = new Date()
    await user.save()
  }

  return { user, created }
}

User.findByWallet = async function(walletAddress) {
  return await this.findOne({
    where: { walletAddress }
  })
}

User.getLeaderboard = async function(limit = 50) {
  return await this.findAll({
    attributes: [
      'id',
      'walletAddress',
      'username',
      'avatarUrl',
      'stats',
      'createdAt'
    ],
    order: [
      [sequelize.literal('("stats"->>\'totalEarnings\')::NUMERIC'), 'DESC NULLS LAST']
    ],
    limit: limit
  })
}

export default User
