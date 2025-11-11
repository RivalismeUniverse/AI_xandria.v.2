'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
        unique: true,
        validate: {
          is: /^0x[a-fA-F0-9]{40}$/
        }
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      profile: {
        type: Sequelize.JSONB,
        defaultValue: {
          bio: '',
          avatar: '',
          socialLinks: {}
        }
      },
      stats: {
        type: Sequelize.JSONB,
        defaultValue: {
          totalBattles: 0,
          battlesWon: 0,
          personasCreated: 0,
          totalSpent: 0,
          totalEarned: 0
        }
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {
          notifications: true,
          theme: 'dark'
        }
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Personas table
    await queryInterface.createTable('personas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tagline: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
          'academic', 'content_creator', 'philosopher', 'technologist', 
          'artist', 'mystical', 'motivation', 'tech', 'wellness', 
          'creative', 'education', 'science', 'psychology', 'arts',
          'fitness', 'therapy', 'business', 'literature', 'lifecoach',
          'futurism', 'relationships'
        ),
        allowNull: false
      },
      specialization: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      traits: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      video_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      visual_prompt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      intelligence_profile: {
        type: Sequelize.JSONB,
        defaultValue: {
          analytical: 50,
          creativity: 50,
          persuasion: 50,
          adaptability: 50,
          technical: 50,
          emotional: 50
        }
      },
      owner_wallet: {
        type: Sequelize.STRING(42),
        allowNull: false,
        references: {
          model: 'users',
          key: 'wallet_address'
        }
      },
      nft_token_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        unique: true
      },
      nft_contract_address: {
        type: Sequelize.STRING(42),
        allowNull: true
      },
      nft_token_uri: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      battle_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      battle_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.INTEGER,
        defaultValue: 1000
      },
      chat_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 5.00
      },
      total_chat_revenue: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      users_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_listed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      listing_price: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Battles table
    await queryInterface.createTable('battles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      persona1_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'personas',
          key: 'id'
        }
      },
      persona2_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'personas',
          key: 'id'
        }
      },
      topic: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      arguments: {
        type: Sequelize.JSONB,
        defaultValue: {
          persona1: null,
          persona2: null
        }
      },
      votes: {
        type: Sequelize.JSONB,
        defaultValue: {
          persona1: [],
          persona2: []
        }
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
      },
      winner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'personas',
          key: 'id'
        }
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['wallet_address']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['last_login']);

    await queryInterface.addIndex('personas', ['owner_wallet']);
    await queryInterface.addIndex('personas', ['category']);
    await queryInterface.addIndex('personas', ['rating']);
    await queryInterface.addIndex('personas', ['nft_token_id']);
    await queryInterface.addIndex('personas', ['is_listed']);
    
    await queryInterface.addIndex('battles', ['status']);
    await queryInterface.addIndex('battles', ['persona1_id', 'persona2_id']);
    await queryInterface.addIndex('battles', ['created_at']);
    await queryInterface.addIndex('battles', ['winner_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('battles');
    await queryInterface.dropTable('personas');
    await queryInterface.dropTable('users');
  }
};
