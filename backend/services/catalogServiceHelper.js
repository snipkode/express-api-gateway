const db = require('../db');

function getService(tenantId, version, name) {
  return db.prepare(`
    SELECT * FROM services 
    WHERE tenant_id = ? AND version = ? AND name = ?
  `).get(tenantId, version, name);
}

function userHasAccess(tenantId, userId, serviceId) {
  return !!db.prepare(`
    SELECT 1 FROM permissions 
    WHERE tenant_id = ? AND user_id = ? AND service_id = ?
  `).get(tenantId, userId, serviceId);
}

// Mengambil rate limit efektif (user-level override jika ada, fallback ke service default)
function getEffectiveRateLimit(tenantId, userId, serviceId) {
  const row = db.prepare(`
    SELECT 
      COALESCE(ur.rate_limit, s.rate_limit) AS effective_rate_limit
    FROM services s
    LEFT JOIN user_rate_limits ur 
      ON ur.user_id = ? AND ur.service_id = s.id
    WHERE s.id = ? AND s.tenant_id = ?
  `).get(userId, serviceId, tenantId);

  return row ? row.effective_rate_limit : null;
}

module.exports = {
  getService,
  userHasAccess,
  getEffectiveRateLimit,
};
