const { sequelize, User, Tenant } = require('./models');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  try {
    // Force sync all models with database (this will drop existing tables)
    await sequelize.sync({ force: false });

    // Create default tenant if it doesn't exist
    let tenant = await Tenant.findOne({
      where: { name: 'default' }
    });

    if (!tenant) {
      tenant = await Tenant.create({ name: 'default' });
      console.log(`Tenant 'default' created`);
    }

    // Create superadmin if it doesn't exist
    const superadmin = await User.findOne({
      where: {
        role: 'superadmin',
        tenant_id: tenant.id
      }
    });

    if (!superadmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.PASSWORD_SUPERADMIN || 'supersecretpassword',
        10
      );

      await User.create({
        username: 'superadmin',
        password: hashedPassword,
        role: 'superadmin',
        tenant_id: tenant.id
      });

      console.log(`Superadmin created for tenant 'default'`);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();

module.exports = sequelize;
