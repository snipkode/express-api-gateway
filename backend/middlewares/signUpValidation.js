const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

// Rate limiting untuk registration endpoint
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // maksimal 5 attempts per IP
  message: { error: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enum untuk role yang diizinkan
const ALLOWED_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
};

// Validasi username
const validateUsername = (username) => {
  const errors = [];
  
  // Cek required
  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string');
    return errors;
  }
  
  // Trim whitespace
  username = username.trim();
  
  // Length validation
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  }
  
  // Character validation - hanya alphanumeric, underscore, dan dash
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and dashes');
  }
  
  // Tidak boleh dimulai dengan angka atau special character
  if (!/^[a-zA-Z]/.test(username)) {
    errors.push('Username must start with a letter');
  }
  
  // Reserved usernames
  const reservedUsernames = ['admin', 'root', 'system', 'api', 'null', 'undefined', 'test'];
  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push('Username is reserved and cannot be used');
  }
  
  return errors;
};

// Validasi password
const validatePassword = (password) => {
  const errors = [];
  
  // Cek required
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
    return errors;
  }
  
  // Length validation
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Complexity requirements
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', '12345678', 'welcome', 'letmein'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  // No sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain more than 2 consecutive identical characters');
  }
  
  return errors;
};

// Validasi role
const validateRole = (role) => {
  const errors = [];
  
  // Cek required
  if (!role || typeof role !== 'string') {
    errors.push('Role is required and must be a string');
    return errors;
  }
  
  // Trim dan lowercase
  role = role.trim().toLowerCase();
  
  // Cek apakah role valid
  const allowedRoleValues = Object.values(ALLOWED_ROLES);
  if (!allowedRoleValues.includes(role)) {
    errors.push(`Role must be one of: ${allowedRoleValues.join(', ')}`);
  }
  
  return errors;
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS characters
  return validator.escape(input.trim());
};

// Middleware tambahan untuk validasi input secara global
const validateRequestBody = (req, res, next) => {
  // Cek content-type
  if (!req.is('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  
  // Cek ukuran payload
  const contentLength = parseInt(req.get('content-length'));
  if (contentLength > 1024 * 1024) { // 1MB limit
    return res.status(413).json({ error: 'Payload too large' });
  }
  
  next();
};

// Export untuk digunakan di routes lain
module.exports = {
  registerLimiter,
  validateUsername,
  validatePassword,
  validateRole,
  sanitizeInput,
  validateRequestBody,
  ALLOWED_ROLES
};