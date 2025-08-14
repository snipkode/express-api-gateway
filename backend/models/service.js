const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Service extends Model {
    static associate(models) {
      Service.belongsTo(models.Tenant);
      Service.hasMany(models.Permission);
      Service.hasMany(models.UserRateLimit);
    }
  }

  Service.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    swagger: DataTypes.TEXT,
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Service',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Service;
};
