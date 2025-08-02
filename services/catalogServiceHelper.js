const db = require('../db');

function getService(tenantId, version, name) {
  return db.prepare(`SELECT * FROM services WHERE tenant_id = ? AND version = ? AND name = ?`)
    .get(tenantId, version, name);
}

function userHasAccess(tenantId, userId, serviceId) {
  return !!db.prepare(`SELECT * FROM permissions WHERE tenant_id = ? AND user_id = ? AND service_id = ?`)
    .get(tenantId, userId, serviceId);
}

function getUserRateLimit(tenantId, userId, serviceId) {
  const row = db.prepare(`SELECT rate_limit FROM user_rate_limits WHERE tenant_id = ? AND user_id = ? AND service_id = ?`)
    .get(tenantId, userId, serviceId);
  return row ? row.rate_limit : null;
}

module.exports = { getService, userHasAccess, getUserRateLimit };
