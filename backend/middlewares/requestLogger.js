const db = require('../db');

module.exports = function requestLogger(req, res, next) {
    
   if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const path = req.originalUrl;
    const status = res.statusCode;
    const user_id = req.user ? req.user.id : null;
    const tenant_id = req.user ? req.user.tenant_id : null;
    const username = req.user ? req.user.username : 'guest';

    // Tentukan action dan resource secara sederhana berdasarkan method
    let action = '';
    if (method === 'POST') action = 'create';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'DELETE') action = 'delete';
    else if (method === 'GET') action = 'access';
    else action = 'other';

    // Ambil resource dari path, contoh: '/services/123' -> 'services'
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0] || 'unknown';

    const description = `[${method}] ${path} - ${status} - ${duration}ms - IP: ${ip} - User: ${username}`;

    // Tulis ke konsol
    console.log(description);

    // Simpan ke audit_logs
    try {
      db.prepare(`
        INSERT INTO audit_logs (user_id, tenant_id, action, resource, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(user_id, tenant_id, action, resource, description);
    } catch (err) {
      console.error('Gagal menyimpan audit log:', err);
    }
  });

  next();
};
