// ChatSession.js
const ChatSession = (sequelize, DataTypes) => {
  return sequelize.define('ChatSession', {
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
};

// ChatMessage.js
const ChatMessage = (sequelize, DataTypes) => {
  return sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chat_sessions',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['user', 'assistant']]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'chat_messages',
    timestamps: false,
    indexes: [
      { fields: ['session_id'] },
      { fields: ['created_at'] }
    ]
  });
};

// Export both
module.exports = { ChatSession, ChatMessage };
