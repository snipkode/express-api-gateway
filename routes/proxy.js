const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const rateLimit = require('express-rate-limit');
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

// Gunakan object untuk menyimpan instance rate limiter yang sudah dibuat.
// Ini mencegah pembuatan rate limiter baru di setiap request.
const rateLimiters = {};

/**
 * Middleware untuk menemukan service yang sesuai dari database.
 * Menyimpan informasi service di req.service.
 */
const findServiceMiddleware = async (req, res, next) => {
  const { version, serviceName } = req.params;
  const tenantId = req.user.tenant_id;

  // Mencari service di database.
  const service = db.prepare(`
    SELECT * FROM services WHERE tenant_id = ? AND version = ? AND name = ?
  `).get(tenantId, version, serviceName);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  req.service = service;
  next();
};

/**
 * Middleware untuk menerapkan rate limiter dinamis per service.
 * Menggunakan cache (rateLimiters object) untuk menyimpan instance limiter.
 */
const dynamicRateLimiterMiddleware = (req, res, next) => {
  const serviceId = `${req.user.tenant_id}-${req.service.id}`;
  const maxRequests = req.service.rate_limit || 100;

  // Cek apakah rate limiter sudah ada di cache.
  if (!rateLimiters[serviceId]) {
    console.log(`Creating new rate limiter for service: ${serviceId} with max: ${maxRequests}`);
    rateLimiters[serviceId] = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: maxRequests,
      handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests for this service' });
      },
      keyGenerator: (req) => {
        // Menggunakan IP user untuk rate limiting, pastikan ini akurat
        return req.ip;
      }
    });
  }

  // Jalankan middleware rate limiter dari cache.
  rateLimiters[serviceId](req, res, next);
};

/**
 * Middleware untuk mem-proxy request ke target service.
 */
const proxyMiddleware = async (req, res, next) => {
  const { service } = req;
  const { version, serviceName } = req.params;

  try {
    // Construct target URL more robustly.
    const targetUrl = `${service.target}${req.originalUrl.replace(`/api/${version}/${serviceName}`, '')}`;
    
    // Build axios config
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      // Salin headers request.
      headers: { ...req.headers },
      data: req.body,
      responseType: 'stream',
      // Gunakan validateStatus untuk mengizinkan non-2xx response dari target.
      validateStatus: () => true,
    };

    // Hapus headers yang dapat menyebabkan konflik dengan target service.
    delete axiosConfig.headers.host;
    delete axiosConfig.headers['content-length'];

    const response = await axios(axiosConfig);

    // Salin headers dari response target ke response kita.
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    // Kirim status code dari response target.
    res.status(response.status);
    response.data.pipe(res);
  } catch (err) {
    // Tangani error jika axios gagal terhubung.
    console.error(`Proxy Error for ${req.originalUrl}:`, err.message);
    // Jika ada response dari target, gunakan itu.
    if (err.response) {
      res.status(err.response.status).send(err.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }
};


// Gunakan middleware yang sudah dibuat. Urutan middleware penting.
router.use(
  '/:version/:serviceName',
  authenticate,
  findServiceMiddleware,
  dynamicRateLimiterMiddleware,
  proxyMiddleware
);

// Rute untuk dokumentasi Swagger.
router.get('/docs/:version/:serviceName/swagger.json', authenticate, findServiceMiddleware, (req, res) => {
  const service = req.service;
  if (!service || !service.swagger) {
    return res.status(404).json({ error: 'Swagger doc not found' });
  }

  try {
    const swaggerDoc = JSON.parse(service.swagger);
    res.json(swaggerDoc);
  } catch {
    res.status(500).json({ error: 'Invalid swagger JSON' });
  }
});

module.exports = router;
