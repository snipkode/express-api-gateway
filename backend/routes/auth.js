const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');
const authenticate = require('../middlewares/auth');
const { validateUsername, validatePassword, validateRole, sanitizeInput, registerLimiter } = require('../middlewares/signUpValidation');

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
// router.post('/register', authenticate, async (req, res) => {
//   try {
//     const { username, password, role } = req.body;
//     if (!username || !password || !role) {
//       return res.status(400).json({ error: 'Missing fields' });
//     }

//     // hanya superadmin bisa register user baru
//     if (req.user.role !== 'superadmin') {
//       return res.status(403).json({ error: 'Forbidden' });
//     }

//     const tenantId = req.user.tenant_id;

//     // Cek user sudah ada atau belum di tenant
//     const existingUser = db.prepare('SELECT * FROM users WHERE username = ? AND tenant_id = ?').get(username, tenantId);
//     if (existingUser) {
//       return res.status(409).json({ error: 'Username already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     db.prepare('INSERT INTO users (username, password, role, tenant_id) VALUES (?, ?, ?, ?)').run(username, hashedPassword, role, tenantId);

//     res.json({ message: 'User registered' });

//   } catch (err) {
//     console.error('Error during registration:', err.message);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.post('/register', registerLimiter, authenticate, async (req, res) => {
  try {
    let { username, password, role } = req.body;
    
    // Input sanitization
    username = sanitizeInput(username);
    role = sanitizeInput(role);
    // Note: password tidak di-sanitize untuk menjaga karakter khusus
    
    // Validation
    const usernameErrors = validateUsername(username);
    const passwordErrors = validatePassword(password);
    const roleErrors = validateRole(role);
    
    const allErrors = [...usernameErrors, ...passwordErrors, ...roleErrors];
    
    if (allErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: allErrors
      });
    }
    
    // Authorization check - hanya superadmin bisa register user baru
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Only superadmin can register users' });
    }
    
    const tenantId = req.user.tenant_id;
    
    // Sanitize untuk database query
    const cleanUsername = username.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    
    // Cek user sudah ada atau belum di tenant (case-insensitive)
    const existingUser = db.prepare(
      'SELECT * FROM users WHERE LOWER(username) = ? AND tenant_id = ?'
    ).get(cleanUsername, tenantId);
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists in this tenant' });
    }
    
    // Hash password dengan salt rounds yang lebih tinggi untuk production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user ke database
    const createdAt = new Date().toISOString();
    const insertResult = db.prepare(
      'INSERT INTO users (username, password, role, tenant_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(cleanUsername, hashedPassword, cleanRole, tenantId, createdAt);
    
    // Log successful registration (tanpa sensitive data)
    console.log(`User registered successfully: ${cleanUsername}, role: ${cleanRole}, tenant: ${tenantId}`);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: insertResult.lastInsertRowid,
        username: cleanUsername,
        role: cleanRole,
        tenant_id: tenantId
      }
    });
    
  } catch (err) {
    // Log error dengan detail untuk debugging
    console.error('Error during registration:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    // Jangan expose internal error ke client
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Registration failed. Please try again later.'
    });
  }
});


module.exports = router;
