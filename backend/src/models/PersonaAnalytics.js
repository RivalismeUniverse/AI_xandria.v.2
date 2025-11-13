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
module.exports = { PersonaAnalytics };
