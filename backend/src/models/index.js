// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/database');

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

const modelsDir = __dirname; // backend/src/models
const modelFiles = fs.readdirSync(modelsDir).filter(f => {
  // exclude index file itself and non-js files
  return f !== 'index.js' && f.endsWith('.js');
});

const models = {};

// load models dynamically, but only if file exports a factory function
for (const file of modelFiles) {
  try {
    const modPath = path.join(modelsDir, file);
    const required = require(modPath);
    // if module.exports is a function factory, call it
    const modelFactory = (typeof required === 'function') ? required : (required && required.default && typeof required.default === 'function' ? required.default : null);
    if (modelFactory) {
      const model = modelFactory(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    } else {
      // if it exported an object with factories, try to pick common names
      if (required && typeof required === 'object') {
        for (const k of Object.keys(required)) {
          const candidate = required[k];
          if (typeof candidate === 'function') {
            const model = candidate(sequelize, Sequelize.DataTypes);
            models[model.name] = model;
          }
        }
      } else {
        console.warn(`Skipping model file ${file}: not a factory function`);
      }
    }
  } catch (err) {
    // log but continue — this prevents a single bad model from crashing startup
    console.warn(`Failed loading model file ${file}: ${err && err.message}`);
  }
}

// helper to safely get a loaded model
const M = name => models[name] || null;

// --- Setup associations only when both sides exist ---
try {
  // User relationships
  if (M('User') && M('Persona')) {
    M('User').hasMany(M('Persona'), { foreignKey: 'creator_id', as: 'personas' });
    M('Persona').belongsTo(M('User'), { foreignKey: 'creator_id', as: 'creator' });
  }

  if (M('User') && M('BattleVote')) {
    M('User').hasMany(M('BattleVote'), { foreignKey: 'voter_id', as: 'votes' });
  }

  if (M('User') && M('ChatSession')) {
    M('User').hasMany(M('ChatSession'), { foreignKey: 'user_id', as: 'chatSessions' });
  }

  if (M('User') && M('MarketplaceListing')) {
    M('User').hasMany(M('MarketplaceListing'), { foreignKey: 'seller_id', as: 'listings' });
  }

  // Persona relationships
  if (M('Persona') && M('Battle')) {
    M('Persona').hasMany(M('Battle'), { foreignKey: 'persona1_id', as: 'battles1' });
    M('Persona').hasMany(M('Battle'), { foreignKey: 'persona2_id', as: 'battles2' });
  }
  if (M('Persona') && M('ChatSession')) {
    M('Persona').hasMany(M('ChatSession'), { foreignKey: 'persona_id', as: 'chatSessions' });
  }
  if (M('Persona') && M('EvolutionLog')) {
    M('Persona').hasMany(M('EvolutionLog'), { foreignKey: 'persona_id', as: 'evolutionLogs' });
  }
  if (M('Persona') && M('MarketplaceListing')) {
    M('Persona').hasMany(M('MarketplaceListing'), { foreignKey: 'persona_id', as: 'listings' });
  }
  if (M('Persona') && M('PersonaAnalytics')) {
    M('Persona').hasMany(M('PersonaAnalytics'), { foreignKey: 'persona_id', as: 'analytics' });
  }

  // Battle relationships
  if (M('Battle') && M('Persona')) {
    M('Battle').belongsTo(M('Persona'), { foreignKey: 'persona1_id', as: 'persona1' });
    M('Battle').belongsTo(M('Persona'), { foreignKey: 'persona2_id', as: 'persona2' });
    if (M('Battle') && M('BattleVote')) {
      M('Battle').hasMany(M('BattleVote'), { foreignKey: 'battle_id', as: 'votes' });
    }
    if (M('Battle') && M('EvolutionLog')) {
      M('Battle').hasMany(M('EvolutionLog'), { foreignKey: 'battle_id', as: 'evolutionLogs' });
    }
  }

  // BattleVote relationships
  if (M('BattleVote') && M('Battle')) {
    M('BattleVote').belongsTo(M('Battle'), { foreignKey: 'battle_id', as: 'battle' });
  }
  if (M('BattleVote') && M('User')) {
    M('BattleVote').belongsTo(M('User'), { foreignKey: 'voter_id', as: 'voter' });
  }
  if (M('BattleVote') && M('Persona')) {
    M('BattleVote').belongsTo(M('Persona'), { foreignKey: 'voted_for', as: 'persona' });
  }

  // Chat session/message
  if (M('ChatSession') && M('User')) {
    M('ChatSession').belongsTo(M('User'), { foreignKey: 'user_id', as: 'user' });
  }
  if (M('ChatSession') && M('Persona')) {
    M('ChatSession').belongsTo(M('Persona'), { foreignKey: 'persona_id', as: 'persona' });
  }
  if (M('ChatSession') && M('ChatMessage')) {
    M('ChatSession').hasMany(M('ChatMessage'), { foreignKey: 'session_id', as: 'messages' });
  }
  if (M('ChatMessage') && M('ChatSession')) {
    M('ChatMessage').belongsTo(M('ChatSession'), { foreignKey: 'session_id', as: 'session' });
  }

  // EvolutionLog
  if (M('EvolutionLog') && M('Persona')) {
    M('EvolutionLog').belongsTo(M('Persona'), { foreignKey: 'persona_id', as: 'persona' });
  }
  if (M('EvolutionLog') && M('Battle')) {
    M('EvolutionLog').belongsTo(M('Battle'), { foreignKey: 'battle_id', as: 'battle' });
  }

  // MarketplaceListing relations
  if (M('MarketplaceListing') && M('Persona')) {
    M('MarketplaceListing').belongsTo(M('Persona'), { foreignKey: 'persona_id', as: 'persona' });
  }
  if (M('MarketplaceListing') && M('User')) {
    M('MarketplaceListing').belongsTo(M('User'), { foreignKey: 'seller_id', as: 'seller' });
    M('MarketplaceListing').belongsTo(M('User'), { foreignKey: 'buyer_id', as: 'buyer' });
  }

  // PersonaAnalytics
  if (M('PersonaAnalytics') && M('Persona')) {
    M('PersonaAnalytics').belongsTo(M('Persona'), { foreignKey: 'persona_id', as: 'persona' });
  }
} catch (err) {
  console.warn('Error setting up associations (safe-guarded):', err && err.message);
}

module.exports = {
  sequelize,
  Sequelize,
  ...models
};
