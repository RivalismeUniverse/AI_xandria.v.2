module.exports = (sequelize, DataTypes) => {
  const Persona = sequelize.define('Persona', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    personality: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expertise: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    intelligence: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100
      }
    },
    creativity: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100
      }
    },
    persuasiveness: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100
      }
    },
    avatar_url: {
      type: DataTypes.TEXT
    },
    nft_token_id: {
      type: DataTypes.INTEGER
    },
    nft_contract_address: {
      type: DataTypes.STRING(42),
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      }
    },
    is_minted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    total_battles: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_chats: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    elo_rating: {
      type: DataTypes.INTEGER,
      defaultValue: 1200
    },
    revenue_earned: {
      type: DataTypes.DECIMAL(18, 4),
      defaultValue: 0.0
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
    tableName: 'personas',
    timestamps: false,
    indexes: [
      {
        fields: ['creator_id']
      },
      {
        fields: ['elo_rating']
      },
      {
        fields: ['is_minted']
      }
    ]
  });

  return Persona;
};
