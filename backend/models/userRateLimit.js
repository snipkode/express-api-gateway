const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserRateLimit extends Model {
    static associate(models) {
      UserRateLimit.belongsTo(models.User);
      UserRateLimit.belongsTo(models.Service);
      UserRateLimit.belongsTo(models.Tenant);
    }
  }

  UserRateLimit.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Services',
        key: 'id'
      }
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_reset: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UserRateLimit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'service_id', 'tenant_id']
      }
    ]
  });

  return UserRateLimit;
};
