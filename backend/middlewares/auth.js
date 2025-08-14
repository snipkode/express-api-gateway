// Middleware authenticate
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { maxAge: JWT_EXPIRES_IN });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      error: 'Invalid token',
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Token validation failed'
    });
  }
}

module.exports = { authenticateToken, JWT_SECRET, JWT_EXPIRES_IN };