const { AuditLog } = require('../models'); // Assuming you have an AuditLog model defined in your Sequelize setup

module.exports = function requestLogger(req, res, next) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const method = req.method;
    const path = req.originalUrl;
    const status = res.statusCode;
    const user_id = req.user ? req.user.id : null;
    const tenant_id = req.user ? req.user.tenant_id : null;
    const username = req.user ? req.user.username : 'guest';

    // Determine action based on method
    let action = '';
    if (method === 'POST') action = 'create';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'DELETE') action = 'delete';
    else if (method === 'GET') action = 'access';
    else action = 'other';

    // Extract resource from path
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0] || 'unknown';

    const description = `[${method}] ${path} - ${status} - ${duration}ms - IP: ${ip} - User: ${username}`;

    // Log to console
    console.log(description);

    // Save to audit_logs using Sequelize
    try {
      await AuditLog.create({
        user_id,
        tenant_id,
        action,
        resource,
        description,
      });
    } catch (err) {
      console.error('Failed to save audit log:', err);
    }
  });

  next();
};
