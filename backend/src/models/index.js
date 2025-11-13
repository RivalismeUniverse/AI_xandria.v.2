const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Persona = require('./Persona')(sequelize, Sequelize.DataTypes);
const Battle = require('./Battle')(sequelize, Sequelize.DataTypes);
const BattleVote = require('./BattleVote')(sequelize, Sequelize.DataTypes);
const ChatSession = require('./ChatSession')(sequelize, Sequelize.DataTypes);
const ChatMessage = require('./ChatMessage')(sequelize, Sequelize.DataTypes);
const EvolutionLog = require('./EvolutionLog')(sequelize, Sequelize.DataTypes);
const MarketplaceListing = require('./MarketplaceListing')(sequelize, Sequelize.DataTypes);
const PersonaAnalytics = require('./PersonaAnalytics')(sequelize, Sequelize.DataTypes);

// Define relationships
const setupAssociations = () => {
  // User relationships
  User.hasMany(Persona, { foreignKey: 'creator_id', as: 'personas' });
  User.hasMany(BattleVote, { foreignKey: 'voter_id', as: 'votes' });
  User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });
  User.hasMany(MarketplaceListing, { foreignKey: 'seller_id', as: 'listings' });

  // Persona relationships
  Persona.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });
  Persona.hasMany(Battle, { foreignKey: 'persona1_id', as: 'battles1' });
  Persona.hasMany(Battle, { foreignKey: 'persona2_id', as: 'battles2' });
  Persona.hasMany(ChatSession, { foreignKey: 'persona_id', as: 'chatSessions' });
  Persona.hasMany(EvolutionLog, { foreignKey: 'persona_id', as: 'evolutionLogs' });
  Persona.hasMany(MarketplaceListing, { foreignKey: 'persona_id', as: 'listings' });
  Persona.hasMany(PersonaAnalytics, { foreignKey: 'persona_id', as: 'analytics' });

  // Battle relationships
  Battle.belongsTo(Persona, { foreignKey: 'persona1_id', as: 'persona1' });
  Battle.belongsTo(Persona, { foreignKey: 'persona2_id', as: 'persona2' });
  Battle.belongsTo(Persona, { foreignKey: 'winner_id', as: 'winner' });
  Battle.hasMany(BattleVote, { foreignKey: 'battle_id', as: 'votes' });
  Battle.hasMany(EvolutionLog, { foreignKey: 'battle_id', as: 'evolutionLogs' });

  // BattleVote relationships
  BattleVote.belongsTo(Battle, { foreignKey: 'battle_id', as: 'battle' });
  BattleVote.belongsTo(User, { foreignKey: 'voter_id', as: 'voter' });
  BattleVote.belongsTo(Persona, { foreignKey: 'voted_for', as: 'persona' });

  // ChatSession relationships
  ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  ChatSession.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
  ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });

  // ChatMessage relationships
  ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id', as: 'session' });

  // EvolutionLog relationships
  EvolutionLog.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
  EvolutionLog.belongsTo(Battle, { foreignKey: 'battle_id', as: 'battle' });

  // MarketplaceListing relationships
  MarketplaceListing.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
  MarketplaceListing.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
  MarketplaceListing.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

  // PersonaAnalytics relationships
  PersonaAnalytics.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
};

setupAssociations();

module.exports = {
  sequelize,
  Sequelize,
  User,
  Persona,
  Battle,
  BattleVote,
  ChatSession,
  ChatMessage,
  EvolutionLog,
  MarketplaceListing,
  PersonaAnalytics
};
