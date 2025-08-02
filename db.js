const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dbDir = path.join(__dirname, 'databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbFile = path.join(dbDir, 'gateway.db');
const initSql = fs.readFileSync(path.join(__dirname, 'models/init.sql'), 'utf-8');

const db = new Database(dbFile);
db.exec(initSql);

// Fungsi async hash password (sync juga bisa, tapi async lebih baik)
async function createSuperadmin() {
  let tenant = db.prepare(`SELECT * FROM tenants WHERE name = ?`).get('default');
  if (!tenant) {
    db.prepare(`INSERT INTO tenants (name) VALUES (?)`).run('default');
    tenant = db.prepare(`SELECT * FROM tenants WHERE name = ?`).get('default');
    console.log(`Tenant 'default' created`);
  }

  const superadmin = db.prepare(`SELECT * FROM users WHERE role = 'superadmin' AND tenant_id = ?`).get(tenant.id);
  if (!superadmin) {
    const hashedPassword = await bcrypt.hash('supersecretpassword', 10);
    db.prepare(`
      INSERT INTO users (username, password, role, tenant_id)
      VALUES (?, ?, ?, ?)
    `).run('superadmin', hashedPassword, 'superadmin', tenant.id);
    console.log(`Superadmin created for tenant 'default': superadmin / supersecretpassword`);
  }
}

// Karena init harus sync, kita panggil langsung (note: bisa tweak kalau mau async)
(async () => {
  await createSuperadmin();
})();

module.exports = db;
