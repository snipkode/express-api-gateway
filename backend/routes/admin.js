const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middlewares/auth');
const { superadminOnly } = require('../middlewares/signUpValidation');
const checkRole = require('../middlewares/checkRole');

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


// GET /admin/users - lihat semua user tenant (admin, superadmin)
router.get('/users', authenticate, checkRole(['superadmin', 'admin']), (req, res) => {
  const tenantId = req.user.tenant_id;
  const users = db.prepare(`
                SELECT 
                  u.id, 
                  u.username, 
                  u.role, 
                  t.name AS tenant_name
                FROM users u
                JOIN tenants t ON u.tenant_id = t.id
                WHERE u.tenant_id = ?
              `).all(tenantId);

  res.json({ users });
});

// GET /admin/users/:tenantId - lihat semua user tenant (superadmin)
router.get('/users/:tenantId', authenticate, superadminOnly, (req, res) => {
  const tenantId = req.params.tenantId;
  const users = db.prepare(`
                SELECT 
                  u.id, 
                  u.username, 
                  u.role, 
                  t.name AS tenant_name
                FROM users u
                JOIN tenants t ON u.tenant_id = t.id
                WHERE u.tenant_id = ?
              `).all(tenantId);
  res.json({ users });
});

// POST /admin/users/:tenantId/role - tambah/ubah role user tenant
router.post('/users/:tenantId/role', authenticate, checkRole(['superadmin', 'admin']), (req, res) => {
  const tenantId = req.params.tenantId;
  const { userId, role } = req.body;

  if (!userId || !role) return res.status(400).json({ error: 'Missing fields' });

  const roleToCreate = req.body.role ? req.body.role.toLowerCase() : 'user';

  switch (req.user.role) {
    case 'superadmin':
      // superadmin bisa update semua role (tidak ada pembatasan)
      break;
    case 'admin':
      // admin tidak boleh update ke role -> superadmin
      if (roleToCreate === 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Admins cannot update role users to Superadmin' });
      }
      break;
    default:
      return res.status(403).json({ error: 'Forbidden: Invalid role for this operation' });
    }

  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND tenant_id = ?`).get(userId, tenantId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, userId);
  res.json({ message: 'User role updated' });
});

// PATCH /admin/tenants/:id/status - ubah status tenant (aktif/nonaktif)
router.patch('/tenants/:id/status', authenticate, superadminOnly, (req, res) => {
  const tenantId = req.params.id;
  const { status } = req.body;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be either "active" or "disabled"' });
  }

  const tenant = db.prepare(`SELECT * FROM tenants WHERE id = ?`).get(tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  db.prepare(`UPDATE tenants SET status = ? WHERE id = ?`).run(status, tenantId);
  res.json({ message: `Tenant status updated to ${status}` });
});


module.exports = router;
