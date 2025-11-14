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

// 
