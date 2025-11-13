// EvolutionLog.js
module.exports = (sequelize, DataTypes) => {
  const EvolutionLog = sequelize.define('EvolutionLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    persona_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    battle_id: {
      type: DataTypes.UUID,
      references: {
        model: 'battles',
        key: 'id'
      }
    },
    trait_changed: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    old_value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    new_value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'evolution_logs',
    timestamps: false,
    indexes: [
      { fields: ['persona_id'] },
      { fields: ['created_at'] }
    ]
  });
  
  return EvolutionLog;
};

// MarketplaceListing.js
const MarketplaceListing = (sequelize, DataTypes) => {
  return sequelize.define('MarketplaceListing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    persona_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'STT'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sold_at: {
      type: DataTypes.DATE
    },
    buyer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'marketplace_listings',
    timestamps: false,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['seller_id'] },
      { fields: ['price'] }
    ]
  });
};

// PersonaAnalytics.js
const PersonaAnalytics = (sequelize, DataTypes) => {
  return sequelize.define('PersonaAnalytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    persona_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    battles_fought: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    battles_won: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    chat_sessions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    revenue_earned: {
      type: DataTypes.DECIMAL(18, 4),
      defaultValue: 0.0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'persona_analytics',
    timestamps: false,
    indexes: [
      { 
        unique: true,
        fields: ['persona_id', 'date'] 
      }
    ]
  });
};

// Export all
module.exports = { EvolutionLog, MarketplaceListing, PersonaAnalytics };
