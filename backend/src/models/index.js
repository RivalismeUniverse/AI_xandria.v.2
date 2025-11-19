const sequelize = require('../config/database');

// Import models
const Persona = require('./Persona');
const Battle = require('./Battle');
const User = require('./User');

// Define associations
Persona.hasMany(Battle, { foreignKey: 'persona1_id', as: 'battlesAsPersona1' });
Persona.hasMany(Battle, { foreignKey: 'persona2_id', as: 'battlesAsPersona2' });
Battle.belongsTo(Persona, { foreignKey: 'persona1_id', as: 'persona1' });
Battle.belongsTo(Persona, { foreignKey: 'persona2_id', as: 'persona2' });

User.hasMany(Persona, { foreignKey: 'owner_address', sourceKey: 'wallet_address' });
Persona.belongsTo(User, { foreignKey: 'owner_address', targetKey: 'wallet_address' });

module.exports = {
  sequelize,
  Persona,
  Battle,
  User
};
