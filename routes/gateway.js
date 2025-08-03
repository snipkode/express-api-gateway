const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const authenticate = require('../middlewares/auth');

// GET /gateway/services
// List semua services tenant user login
router.get('/services', authenticate, (req, res) => {
  const tenantId = req.user.tenant_id;
  const services = db.prepare(`SELECT id, version, name, target, rate_limit FROM services WHERE tenant_id = ?`).all(tenantId);
  res.json({ services });
});

// POST /gateway/services
// Tambah service baru (hanya superadmin dan admin tenant)
router.post('/services', authenticate, (req, res) => {
  const { version, name, target, swagger, rate_limit } = req.body;
  const { role, tenant_id } = req.user;

  if (!version || !name || !target) return res.status(400).json({ error: 'Missing fields' });

  if (!['superadmin', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

  // Cek service duplikat (version + name + tenant)
  const exists = db.prepare(`SELECT * FROM services WHERE version = ? AND name = ? AND tenant_id = ?`).get(version, name, tenant_id);
  if (exists) return res.status(409).json({ error: 'Service already exists' });

  db.prepare(`
    INSERT INTO services (version, name, target, swagger, rate_limit, tenant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(version, name, target, swagger || null, rate_limit || 100, tenant_id);

  res.json({ message: 'Service added' });
});

// PUT /gateway/services/:id/rate-limit
// Update rate limit per service (hanya superadmin/admin tenant)
router.put('/services/:id/rate-limit', authenticate, (req, res) => {
  const { id } = req.params;
  const { rate_limit } = req.body;
  const { role, tenant_id } = req.user;

  if (rate_limit == null) return res.status(400).json({ error: 'Missing rate_limit' });
  if (!['superadmin', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

  const service = db.prepare(`SELECT * FROM services WHERE id = ? AND tenant_id = ?`).get(id, tenant_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  db.prepare(`UPDATE services SET rate_limit = ? WHERE id = ?`).run(rate_limit, id);
  res.json({ message: 'Rate limit updated' });
});

// User override rate_limit untuk service tertentu
router.put('/services/:id/user-rate-limit', authenticate, (req, res) => {
  const { id: service_id } = req.params;
  const { rate_limit } = req.body;
  const { id: user_id, tenant_id, role } = req.user;

  // Validasi nilai rate_limit
  if (rate_limit == null || typeof rate_limit !== 'number' || rate_limit <= 0) {
    return res.status(400).json({ error: 'Invalid or missing rate_limit' });
  }

  // Pastikan service ada dan dari tenant yang sama
  const service = db.prepare(`
    SELECT * FROM services WHERE id = ? AND tenant_id = ?
  `).get(service_id, tenant_id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Jika superadmin atau admin tenant, diizinkan langsung
  const isAdmin = ['superadmin', 'admin'].includes(role);

  // Kalau bukan admin, cek apakah user punya permission ke service
  let hasPermission = false;
  if (!isAdmin) {
    const permission = db.prepare(`
      SELECT 1 FROM permissions
      WHERE user_id = ? AND service_id = ? AND tenant_id = ?
    `).get(user_id, service_id, tenant_id);

    if (!permission) {
      return res.status(403).json({ error: 'You do not have permission to this service' });
    }

    hasPermission = true;
  }

  // Admin boleh override semua user mereka sendiri
  // Simpan atau update rate_limit override
  const existing = db.prepare(`
    SELECT 1 FROM user_rate_limits WHERE user_id = ? AND service_id = ?
  `).get(user_id, service_id);

  if (existing) {
    db.prepare(`
      UPDATE user_rate_limits SET rate_limit = ? WHERE user_id = ? AND service_id = ?
    `).run(rate_limit, user_id, service_id);
  } else {
    db.prepare(`
      INSERT INTO user_rate_limits (user_id, service_id, tenant_id, rate_limit)
      VALUES (?, ?, ?, ?)
    `).run(user_id, service_id, tenant_id, rate_limit);
  }

  res.json({ message: 'Rate limit override updated' });
});


// POST /gateway/services/:id/permissions
// Tambah permission user ke service (hanya superadmin / admin tenant)
router.post('/services/:id/permissions', authenticate, (req, res) => {
  const { id: service_id } = req.params;
  const { user_id } = req.body;
  const { role, tenant_id } = req.user;

  if (!['superadmin', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  // Pastikan service valid dan milik tenant yang sama
  const service = db.prepare(`SELECT * FROM services WHERE id = ? AND tenant_id = ?`).get(service_id, tenant_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  // Pastikan user ada dan dari tenant yang sama
  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND tenant_id = ?`).get(user_id, tenant_id);
  if (!user) return res.status(404).json({ error: 'User not found or not in your tenant' });

  // Cek permission sudah ada
  const existing = db.prepare(`
    SELECT 1 FROM permissions WHERE user_id = ? AND service_id = ?
  `).get(user_id, service_id);
  if (existing) {
    return res.status(409).json({ error: 'Permission already exists' });
  }

  // Tambah permission
  db.prepare(`
    INSERT INTO permissions (user_id, service_id, tenant_id)
    VALUES (?, ?, ?)
  `).run(user_id, service_id, tenant_id);

  res.json({ message: 'Permission added' });
});

// DELETE /gateway/services/:id/permissions/:userId
// Hapus permission user ke service (hanya superadmin / admin tenant)
router.delete('/services/:id/permissions/:userId', authenticate, (req, res) => {
  const { id: service_id, userId: user_id } = req.params;
  const { role, tenant_id } = req.user;

  if (!['superadmin', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Pastikan permission ada dan dalam tenant
  const permission = db.prepare(`
    SELECT 1 FROM permissions WHERE user_id = ? AND service_id = ? AND tenant_id = ?
  `).get(user_id, service_id, tenant_id);

  if (!permission) {
    return res.status(404).json({ error: 'Permission not found' });
  }

  db.prepare(`
    DELETE FROM permissions WHERE user_id = ? AND service_id = ?
  `).run(user_id, service_id);

  res.json({ message: 'Permission removed' });
});



module.exports = router;
