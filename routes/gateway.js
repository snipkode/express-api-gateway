const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware authenticate
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

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

module.exports = router;
