const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Permission extends Model {
    static associate(models) {
      Permission.belongsTo(models.User);
      Permission.belongsTo(models.Service);
      Permission.belongsTo(models.Tenant);
    }
  }

  Permission.init({
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
    access_level: {
      type: DataTypes.STRING,
      defaultValue: 'read'
    }
  }, {
    sequelize,
    modelName: 'Permission',
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

  return Permission;
};
