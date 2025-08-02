const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware validasi token (simple)
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

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password, tenant } = req.body;
  if (!username || !password || !tenant) return res.status(400).json({ error: 'Missing fields' });

  const tenantRow = db.prepare(`SELECT * FROM tenants WHERE name = ?`).get(tenant);
  if (!tenantRow) return res.status(404).json({ error: 'Tenant not found' });

  const user = db.prepare(`SELECT * FROM users WHERE username = ? AND tenant_id = ?`).get(username, tenantRow.id);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({
    id: user.id,
    username: user.username,
    role: user.role,
    tenant_id: user.tenant_id,
  }, JWT_SECRET, { expiresIn: '12h' });

  res.json({ token });
});

// POST /auth/register
// hanya superadmin di tenant yang sama yang bisa register user baru
router.post('/register', authenticate, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  // hanya superadmin bisa register user baru
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });

  const tenantId = req.user.tenant_id;

  // Cek user sudah ada atau belum di tenant
  const existingUser = db.prepare(`SELECT * FROM users WHERE username = ? AND tenant_id = ?`).get(username, tenantId);
  if (existingUser) return res.status(409).json({ error: 'Username already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.prepare(`
    INSERT INTO users (username, password, role, tenant_id)
    VALUES (?, ?, ?, ?)
  `).run(username, hashedPassword, role, tenantId);

  res.json({ message: 'User registered' });
});

module.exports = router;
