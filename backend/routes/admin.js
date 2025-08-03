const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middlewares/auth');

function superadminOnly(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden, superadmin only' });
  }
  next();
}

// POST /admin/tenants - tambah tenant baru (superadmin only)
router.post('/tenants', authenticate, superadminOnly, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tenant name is required' });
  }

  // Cek apakah nama tenant sudah ada
  const existingTenant = db.prepare(`SELECT * FROM tenants WHERE name = ?`).get(name);
  if (existingTenant) {
    return res.status(409).json({ error: 'Tenant name already exists' });
  }

  // Simpan tenant baru
  const result = db.prepare(`INSERT INTO tenants (name) VALUES (?)`).run(name);

  res.status(201).json({
    message: 'Tenant created successfully',
    tenant: {
      id: result.lastInsertRowid,
      name,
    },
  });
});

// GET /admin/tenants - lihat semua tenant (superadmin)
router.get('/tenants', authenticate, superadminOnly, (req, res) => {
  const tenants = db.prepare(`SELECT id, name FROM tenants`).all();
  res.json({ tenants });
});

// GET /admin/users/:tenantId - lihat semua user tenant (superadmin)
router.get('/users/:tenantId', authenticate, superadminOnly, (req, res) => {
  const tenantId = req.params.tenantId;
  const users = db.prepare(`SELECT id, username, role FROM users WHERE tenant_id = ?`).all(tenantId);
  res.json({ users });
});

// POST /admin/users/:tenantId/role - tambah/ubah role user tenant
router.post('/users/:tenantId/role', authenticate, superadminOnly, (req, res) => {
  const tenantId = req.params.tenantId;
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'Missing fields' });

  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND tenant_id = ?`).get(userId, tenantId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, userId);
  res.json({ message: 'User role updated' });
});

module.exports = router;
