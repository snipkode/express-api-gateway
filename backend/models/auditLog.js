const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'SET NULL'
      });
      AuditLog.belongsTo(models.Tenant, {
        foreignKey: 'tenant_id',
        onDelete: 'SET NULL'
      });
    }
  }

  AuditLog.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resource: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'AuditLog',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  return AuditLog;
};
