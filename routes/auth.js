const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');
const authenticate = require('../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, tenant } = req.body;
    if (!username || !password || !tenant) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const tenantRow = db.prepare('SELECT * FROM tenants WHERE name = ?').get(tenant);
    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND tenant_id = ?').get(username, tenantRow.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
    }, JWT_SECRET, { expiresIn: '12h' });

    res.json({ token });

  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /auth/register
// hanya superadmin di tenant yang sama yang bisa register user baru
router.post('/register', authenticate, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // hanya superadmin bisa register user baru
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tenantId = req.user.tenant_id;

    // Cek user sudah ada atau belum di tenant
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? AND tenant_id = ?').get(username, tenantId);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare('INSERT INTO users (username, password, role, tenant_id) VALUES (?, ?, ?, ?)').run(username, hashedPassword, role, tenantId);

    res.json({ message: 'User registered' });

  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
