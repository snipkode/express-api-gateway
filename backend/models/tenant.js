const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tenant extends Model {
    static associate(models) {
      Tenant.hasMany(models.User);
      Tenant.hasMany(models.Service);
      Tenant.hasMany(models.Permission);
      Tenant.hasMany(models.UserRateLimit);
      Tenant.hasMany(models.AuditLog);
    }
  }

  Tenant.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    display_name: DataTypes.STRING,
    owner_email: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    subscription_plan: {
      type: DataTypes.STRING,
      defaultValue: 'free'
    },
    subscription_expiry: DataTypes.DATE,
    max_users: DataTypes.INTEGER,
    custom_domain: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    settings_json: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Tenant',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Tenant;
};
