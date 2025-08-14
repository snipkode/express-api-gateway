const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(config.development);

const models = {
  Tenant: require('./tenant')(sequelize),
  User: require('./user')(sequelize),
  Service: require('./service')(sequelize),
  Permission: require('./permission')(sequelize),
  UserRateLimit: require('./userRateLimit')(sequelize),
  AuditLog: require('./auditLog')(sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
