module.exports = (sequelize, DataTypes) => {
  const Battle = sequelize.define('Battle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    topic: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    persona1_argument: {
      type: DataTypes.TEXT
    },
    persona2_argument: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'voting', 'completed', 'failed']]
      }
    },
    winner_id: {
      type: DataTypes.UUID,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    persona1_votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    persona2_votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'battles',
    timestamps: false,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['persona1_id', 'persona2_id']
      },
      {
        fields: ['completed_at']
      }
    ]
  });

  return Battle;
};
