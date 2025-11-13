module.exports = (sequelize, DataTypes) => {
  const BattleVote = sequelize.define('BattleVote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    battle_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'battles',
        key: 'id'
      }
    },
    voter_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    voted_for: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      }
    },
    voted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'battle_votes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['battle_id', 'voter_id']
      },
      {
        fields: ['battle_id']
      },
      {
        fields: ['voter_id']
      }
    ]
  });

  return BattleVote;
};
