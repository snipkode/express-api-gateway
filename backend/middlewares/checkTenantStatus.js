const { Tenant } = require('../models');

async function checkTenantStatus(req, res, next) {
  try {
    const tenantId = req.user.tenant_id || req.user.tenant;

    const tenant = await Tenant.findOne({
      where: { 
        id: tenantId,
        status: 'active'
      }
    });

    if (!tenant) {
      return res.status(403).json({ error: 'Access denied. Tenant is disabled or does not exist.' });
    }

    next();
  } catch (error) {
    console.error('Tenant status check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = checkTenantStatus;
