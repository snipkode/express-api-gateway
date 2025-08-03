const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middlewares/auth');
const dynamicRateLimiter = require('../dynamicRateLimiter');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// Dynamic rate limiter middleware generator
function createRateLimiter(max) {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests' });
    }
  });
}

// Proxy all routes: /api/:version/:serviceName/*
router.use('/:version/:serviceName', authenticateToken, async (req, res, next) => {
  const { version, serviceName } = req.params;
  const tenantId = req.user.tenant_id;

  // Cari service tenant sesuai version & name
  const service = db.prepare(`
    SELECT * FROM services WHERE tenant_id = ? AND version = ? AND name = ?
  `).get(tenantId, version, serviceName);

  if (!service) return res.status(404).json({ error: 'Service not found' });

  // Rate limit per service
  const limiter = createRateLimiter(service.rate_limit || 100);
  limiter(req, res, async () => {
    try {
      // Proxy request ke target service
      const targetUrl = new URL(req.originalUrl, service.target);

      // Build axios config
      const axiosConfig = {
        method: req.method,
        url: service.target + req.originalUrl.replace(`/${version}/${serviceName}`, ''),
        headers: { ...req.headers },
        data: req.body,
        responseType: 'stream',
      };

      // Remove host header to avoid conflict
      delete axiosConfig.headers.host;

      const response = await axios(axiosConfig);

      res.status(response.status);
      response.data.pipe(res);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Proxy error' });
    }
  });
});

// GET /docs/:version/:serviceName/swagger.json
router.get('/docs/:version/:serviceName/swagger.json', authenticateToken, (req, res) => {
  const { version, serviceName } = req.params;
  const tenantId = req.user.tenant_id;

  const service = db.prepare(`
    SELECT swagger FROM services WHERE tenant_id = ? AND version = ? AND name = ?
  `).get(tenantId, version, serviceName);

  if (!service || !service.swagger) return res.status(404).json({ error: 'Swagger doc not found' });

  try {
    const swaggerDoc = JSON.parse(service.swagger);
    res.json(swaggerDoc);
  } catch {
    res.status(500).json({ error: 'Invalid swagger JSON' });
  }
});

module.exports = router;
