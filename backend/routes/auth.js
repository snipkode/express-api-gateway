const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Tenant } = require('../models');
const {authenticateToken} = require('../middlewares/auth');
const validateRolePublic = require('../middlewares/validateRolePublic');
const checkRole = require('../middlewares/checkRole');
const { validateUsername, validatePassword, validateRole, sanitizeInput, registerLimiter, superadminOnly, ALLOWED_ROLES } = require('../middlewares/signUpValidation');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, tenant } = req.body;
    if (!username || !password || !tenant) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const tenantRow = await Tenant.findOne({ 
      where: { name: tenant }
    });
    
    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const user = await User.findOne({ 
      where: { 
        username,
        tenant_id: tenantRow.id 
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
    }, JWT_SECRET, { expiresIn: '12h' });

    res.json({ 
      token, 
      user: {
        username: user.username, 
        role: user.role, 
        tenant: user.tenant_id
      } 
    });

  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/register', [registerLimiter, validateRolePublic], async (req, res) => {
  try {
    let { username, password, role, tenant_id } = req.body;

     if (!username || !password || !role || !tenant_id) {
      return res.status(400).json({ error: 'Username, password, role, and tenant_id are required' });
    }
    
    // Input sanitization
    username = sanitizeInput(username);
    role = sanitizeInput(role);
    tenant_id = sanitizeInput(tenant_id);
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
    
    const tenantId = tenant_id;
    
    // Sanitize untuk database query
    const cleanUsername = username.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    
    // Cek user sudah ada atau belum di tenant (case-insensitive)
    const existingUser = await User.findOne({
      where: {
        username: cleanUsername,
        tenant_id: tenantId
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists in this tenant' });
    }
    
    // Hash password dengan salt rounds yang lebih tinggi untuk production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user ke database
    const createdAt = new Date().toISOString();
    const newUser = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      role: cleanRole,
      tenant_id: tenantId,
      created_at: createdAt
    });
    
    // Log successful registration (tanpa sensitive data)
    console.log(`User registered successfully: ${cleanUsername}, role: ${cleanRole}, tenant: ${tenantId}`);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: newUser.id,
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

router.post('/register/tenant', registerLimiter, authenticateToken, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    let { username, password, role, tenant_id } = req.body;

     if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    // Input sanitization
    username = sanitizeInput(username);
    role = sanitizeInput(role);
    tenant_id = sanitizeInput(tenant_id);
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

let tenantId;

switch (req.user.role) {
  case 'superadmin':
    tenantId = req.body.tenant_id ? req.body.tenant_id : req.user.tenant_id;
    break;
  case 'admin':
    tenantId = req.user.tenant_id;
    break;
  default:
    return res.status(403).json({ error: 'Forbidden: Invalid role for this operation' });
}

// Batasan role yang boleh dibuat
const roleToCreate = req.body.role ? req.body.role.toLowerCase() : 'user';

switch (req.user.role) {
  case 'superadmin':
    // superadmin bisa membuat semua role (tidak ada pembatasan)
    break;
  case 'admin':
    // admin tidak boleh membuat superadmin
    if (roleToCreate === 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Admins cannot create superadmin users' });
    }
    break;
  default:
    return res.status(403).json({ error: 'Forbidden: Invalid role for this operation' });
}

    // Sanitize untuk database query
    const cleanUsername = username.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    
    // Cek user sudah ada atau belum di tenant (case-insensitive)
    const existingUser = await User.findOne({
      where: {
        username: cleanUsername,
        tenant_id: tenantId
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists in this tenant' });
    }
    
    // Hash password dengan salt rounds yang lebih tinggi untuk production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user ke database
    const createdAt = new Date().toISOString();
    const newUser = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      role: cleanRole,
      tenant_id: tenantId,
      created_at: createdAt
    });
    
    // Log successful registration (tanpa sensitive data)
    console.log(`User registered successfully: ${cleanUsername}, role: ${cleanRole}, tenant: ${tenantId}`);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: newUser.id,
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
