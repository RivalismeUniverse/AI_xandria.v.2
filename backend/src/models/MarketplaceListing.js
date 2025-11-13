// MarketplaceListing.js
const MarketplaceListing = (sequelize, DataTypes) => {
  return sequelize.define('MarketplaceListing', {
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
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'STT'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sold_at: {
      type: DataTypes.DATE
    },
    buyer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'marketplace_listings',
    timestamps: false,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['seller_id'] },
      { fields: ['price'] }
    ]
  });
};
module.exports = { MarketplaceListing };
