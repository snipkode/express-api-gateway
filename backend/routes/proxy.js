const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const rateLimit = require('express-rate-limit');
const dynamicRateLimiter = require('../dynamicRateLimiter');

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
  findServiceMiddleware,
  dynamicRateLimiter,
  proxyMiddleware
);

// Rute untuk dokumentasi Swagger.
router.get('/docs/:version/:serviceName/swagger.json', findServiceMiddleware, (req, res) => {
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
