const { Service, Permission, UserRateLimit } = require('../models');

async function getService(tenantId, version, name) {
  return await Service.findOne({
    where: {
      tenant_id: tenantId,
      version,
      name
    }
  });
}

async function userHasAccess(tenantId, userId, serviceId) {
  const permission = await Permission.findOne({
    where: {
      tenant_id: tenantId,
      user_id: userId,
      service_id: serviceId
    }
  });
  return !!permission;
}

async function getEffectiveRateLimit(tenantId, userId, serviceId) {
  const service = await Service.findOne({
    where: { id: serviceId, tenant_id: tenantId },
    include: [{
      model: UserRateLimit,
      where: { user_id: userId },
      required: false
    }]
  });

  if (!service) return null;
  return service.UserRateLimits?.[0]?.rate_limit || service.rate_limit;
}

module.exports = {
  getService,
  userHasAccess,
  getEffectiveRateLimit,
};
