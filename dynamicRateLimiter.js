const rateLimit = require('express-rate-limit');
const { getService, getUserRateLimit, userHasAccess } = require('./services/catalogServiceHelper');

const limiterCache = new Map();

function getLimiterKey(tenantId, userId, serviceId, maxRequests) {
  return `${tenantId}-${userId}-${serviceId}-${maxRequests}`;
}

const dynamicRateLimiter = async (req, res, next) => {
  console.log(req.user);
  try {
    const match = req.originalUrl.match(/^\/api\/(v\d+)\/([^\/]+)/);
    if (!match) return next();

    const version = match[1];
    const serviceName = match[2];
    const user = req.user;
    const tenantId = user?.tenant_id;

    if (!user || !tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const service = await getService(tenantId, version, serviceName);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const hasAccess = await userHasAccess(tenantId, user.id, service.id);
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const userLimit = await getUserRateLimit(tenantId, user.id, service.id);
    const maxRequests = userLimit || service.rate_limit || 100;

    const key = getLimiterKey(tenantId, user.id, service.id, maxRequests);

    if (!limiterCache.has(key)) {
      limiterCache.set(key, rateLimit({
        windowMs: 60 * 1000,
        max: maxRequests,
        keyGenerator: () => `${tenantId}-${user.id}-${service.id}`,
        handler: (req, res) => res.status(429).json({ error: 'Rate limit exceeded' }),
      }));
    }

    return limiterCache.get(key)(req, res, next);
  } catch (err) {
    console.error('Rate limiter error:', err);
    return next(err);
  }
};

module.exports = dynamicRateLimiter;
