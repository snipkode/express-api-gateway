-- Tabel tenant
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Tabel pengguna
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'superadmin', 'admin', 'user'
  tenant_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(username, tenant_id)
);

-- Tabel layanan (API yang didaftarkan)
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  swagger TEXT,
  rate_limit INTEGER DEFAULT 100,
  tenant_id INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(version, name, tenant_id)
);

-- Hak akses user ke service
CREATE TABLE IF NOT EXISTS permissions (
  user_id INTEGER,
  service_id INTEGER,
  tenant_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, service_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Rate limit per user per service (override dari default service)
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id INTEGER,
  service_id INTEGER,
  rate_limit INTEGER,
  tenant_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, service_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

