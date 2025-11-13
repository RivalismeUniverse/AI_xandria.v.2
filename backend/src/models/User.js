module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      }
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true
      }
    },
    last_login: {
      type: DataTypes.DATE
    },
    total_revenue: {
      type: DataTypes.DECIMAL(18, 4),
      defaultValue: 0.0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['wallet_address']
      },
      {
        unique: true,
        fields: ['username']
      }
    ]
  });

  return User;
};
