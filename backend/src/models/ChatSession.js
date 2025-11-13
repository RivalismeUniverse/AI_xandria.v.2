// ChatSession.js - Export as function
module.exports = (sequelize, DataTypes) => {
  const ChatSession = sequelize.define('ChatSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    persona_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    payment_tx_hash: {
      type: DataTypes.STRING(66)
    },
    amount_paid: {
      type: DataTypes.DECIMAL(18, 4)
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    message_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_message_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'chat_sessions',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['persona_id'] },
      { fields: ['is_paid'] }
    ]
  });
  
  return ChatSession;
};
module.exports = { ChatSession }
