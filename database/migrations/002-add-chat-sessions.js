'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Chat sessions table
    await queryInterface.createTable('chat_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      persona_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'personas',
          key: 'id'
        }
      },
      user_wallet: {
        type: Sequelize.STRING(42),
        allowNull: false,
        references: {
          model: 'users',
          key: 'wallet_address'
        }
      },
      unlock_transaction_hash: {
        type: Sequelize.STRING(66),
        allowNull: true
      },
      amount_paid: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: true
      },
      messages: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      unlocked_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_activity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP + INTERVAL '24 hours'")
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for chat sessions
    await queryInterface.addIndex('chat_sessions', ['user_wallet']);
    await queryInterface.addIndex('chat_sessions', ['persona_id']);
    await queryInterface.addIndex('chat_sessions', ['is_active']);
    await queryInterface.addIndex('chat_sessions', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_sessions');
  }
};
