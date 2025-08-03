PRAGMA foreign_keys = ON;  -- Aktifkan dukungan foreign key di SQLite

-- ========================
-- TABEL TENANTS
-- ========================
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                    -- ID unik tenant
  name TEXT UNIQUE NOT NULL,                               -- Nama unik tenant (slug)
  display_name TEXT,                                       -- Nama tampilan tenant
  owner_email TEXT,                                        -- Email pemilik/admin tenant
  status TEXT DEFAULT 'active',                            -- Status tenant ('active', 'inactive')
  subscription_plan TEXT DEFAULT 'free',                   -- Paket langganan (free, pro, dll)
  subscription_expiry DATETIME,                            -- Masa berlaku langganan
  max_users INTEGER,                                       -- Batas maksimal user di tenant ini
  custom_domain TEXT,                                      -- Domain kustom milik tenant (opsional)
  logo_url TEXT,                                           -- URL logo atau branding tenant
  settings_json TEXT,                                      -- Konfigurasi tambahan dalam format JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,           -- Waktu tenant dibuat
  updated_at DATETIME                                      -- Waktu tenant terakhir diperbarui
);

-- ========================
-- TABEL USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                    -- ID unik user
  username TEXT NOT NULL,                                  -- Username login
  password TEXT NOT NULL,                                  -- Password (hash bcrypt)
  role TEXT NOT NULL,                                      -- Peran user ('superadmin', 'admin', 'user')
  tenant_id INTEGER NOT NULL,                              -- Relasi ke tenant asal
  status TEXT DEFAULT 'active',                            -- Status user ('active', 'inactive')
  last_login DATETIME,                                     -- Terakhir kali user login
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,           -- Waktu user dibuat
  updated_at DATETIME,                                     -- Waktu user terakhir diperbarui
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE  -- Hapus user jika tenant-nya dihapus
);

-- ========================
-- TABEL SERVICES (revisi tanpa merusak API)
-- ========================
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                     -- ID unik service
  name TEXT NOT NULL,                                       -- Nama service (slug pendek)
  target TEXT NOT NULL,                                     -- Alamat asli backend yang diproxy
  version TEXT NOT NULL,                                    -- Versi service (v1, v2, dll)
  tenant_id INTEGER NOT NULL,                               -- ID tenant pemilik service
  description TEXT,                                         -- Deskripsi singkat (opsional)
  status TEXT DEFAULT 'active',                             -- Status aktif/nonaktif
  rate_limit INTEGER DEFAULT 100,                           -- Rate limit default per user
  swagger TEXT,                                             -- File dokumentasi Swagger (opsional)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Timestamp saat dibuat
  updated_at DATETIME,                                      -- Timestamp saat diperbarui
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE, -- Hapus semua servicenya jika tenant dihapus
  UNIQUE(version, name, tenant_id)                          -- Unik berdasarkan versi, nama, dan tenant
);


-- =====================
-- TABEL PERMISSIONS
-- =====================
-- Menyimpan hak akses user terhadap service tertentu dalam konteks tenant.

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                     -- ID unik permission
  user_id INTEGER NOT NULL,                                 -- ID user yang diberikan permission
  service_id INTEGER NOT NULL,                              -- ID service yang diakses
  tenant_id INTEGER NOT NULL,                               -- ID tenant (multi-tenant support)
  access_level TEXT DEFAULT 'read',                         -- Hak akses: read / write / full
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Waktu permission dibuat
  updated_at DATETIME,                                      -- Waktu terakhir permission diperbarui

  -- Relasi ke tabel users, services, dan tenants
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,         -- Hapus jika user terkait dihapus
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,   -- Hapus jika service terkait dihapus
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,     -- Hapus jika tenant terkait dihapus
  UNIQUE(user_id, service_id, tenant_id) 

);

-- ========================
-- TABEL AUDIT LOGS
-- ========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                    -- ID log
  user_id INTEGER,                                         -- User yang melakukan aksi
  tenant_id INTEGER,                                       -- Tenant terkait
  action TEXT NOT NULL,                                    -- Jenis aksi (login, update, delete, dll)
  resource TEXT,                                           -- Objek yang dipengaruhi (contoh: 'users', 'services')
  description TEXT,                                        -- Deskripsi singkat log
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Waktu kejadian log
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,       -- User bisa jadi null jika dihapus
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL    -- Tenant juga bisa null
);


-- ============================
-- TABEL USER_RATE_LIMITS
-- ============================
-- Menyimpan data kuota request spesifik untuk tiap user terhadap service tertentu,
-- termasuk kemampuan override rate_limit bawaan service.
-- Mendukung sistem multi-tenant melalui kolom tenant_id.

CREATE TABLE IF NOT EXISTS user_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                     -- ID unik untuk setiap entri
  user_id INTEGER NOT NULL,                                 -- ID user yang menggunakan service
  service_id INTEGER NOT NULL,                              -- ID service yang digunakan
  tenant_id INTEGER NOT NULL,                               -- ID tenant (multi-tenant support)
  rate_limit INTEGER NOT NULL DEFAULT 0,                    -- Override batas maksimal request (opsional)
  remaining INTEGER NOT NULL DEFAULT 0,                     -- Sisa kuota request saat ini
  last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Waktu terakhir reset rate limit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Waktu entri dibuat
  updated_at DATETIME,                                      -- Waktu entri terakhir diperbarui

  -- Relasi terhadap tabel users dan services
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,       -- Hapus entri ini jika user terkait dihapus
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE, -- Hapus entri ini jika service terkait dihapus
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,   -- Hapus entri ini jika tenant terkait dihapus

  UNIQUE(user_id, service_id, tenant_id)                              -- Kombinasi unik per user, service, dan tenant
);


-- Trigger: Perbarui updated_at saat baris diubah
CREATE TRIGGER IF NOT EXISTS trg_user_rate_limits_updated_at
AFTER UPDATE ON user_rate_limits
FOR EACH ROW
BEGIN
  UPDATE user_rate_limits
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;


-- ========================
-- TRIGGER UNTUK UPDATE updated_at OTOMATIS
-- ========================

-- Trigger: saat baris tenant diubah, updated_at diperbarui otomatis
CREATE TRIGGER IF NOT EXISTS trg_tenants_updated_at
AFTER UPDATE ON tenants
FOR EACH ROW
BEGIN
  UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: saat baris user diubah, updated_at diperbarui otomatis
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: saat baris service diubah, updated_at diperbarui otomatis
CREATE TRIGGER IF NOT EXISTS trg_services_updated_at
AFTER UPDATE ON services
FOR EACH ROW
BEGIN
  UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: saat baris permission diubah, updated_at diperbarui otomatis
CREATE TRIGGER IF NOT EXISTS trg_permissions_updated_at
AFTER UPDATE ON permissions
FOR EACH ROW
BEGIN
  UPDATE permissions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
