const db = require('../db');

function checkTenantStatus(req, res, next) {
  const tenantId = req.user.tenant_id || req.user.tenant; // sesuaikan struktur token

  const tenant = db.prepare(`SELECT status FROM tenants WHERE id = ?`).get(tenantId);
  if (!tenant || tenant.status !== 'active') {
    return res.status(403).json({ error: 'Access denied. Tenant is disabled or does not exist.' });
  }

  next();
}

module.exports = checkTenantStatus;
