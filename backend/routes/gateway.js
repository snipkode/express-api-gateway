const express = require('express');
const router = express.Router();
const { Service, Permission, UserRateLimit, Tenant } = require('../models');
const { authenticateToken } = require('../middlewares/auth');

// GET /gateway/services
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const services = await Service.findAll({
      where: { tenant_id },
      attributes: ['id', 'version', 'name', 'target', 'rate_limit'],
      raw: true,
      nest: true
    });

    res.json({
      services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /gateway/services
router.post('/services', authenticateToken, async (req, res) => {
  try {
    const { version, name, target, swagger, rate_limit } = req.body;
    const { role, tenant_id } = req.user;

    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!version || !name || !target) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existingService = await Service.findOne({
      where: {
        version,
        name,
        tenant_id
      }
    });

    if (existingService) {
      return res.status(409).json({ error: 'Service already exists' });
    }

    const service = await Service.create({
      version,
      name,
      target,
      swagger,
      rate_limit: rate_limit || 100,
      tenant_id
    });

    res.json({
      message: 'Service added',
      service: service.toJSON()
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /gateway/services/:id/rate-limit
router.put('/services/:id/rate-limit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_limit } = req.body;
    const { role, tenant_id } = req.user;

    if (rate_limit == null) {
      return res.status(400).json({ error: 'Missing rate_limit' });
    }

    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const service = await Service.findOne({
      where: { id, tenant_id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    service.rate_limit = rate_limit;
    await service.save();

    res.json({ message: 'Rate limit updated' });
  } catch (error) {
    console.error('Error updating rate limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /gateway/services/:id/permissions/:userId
router.delete('/services/:id/permissions/:userId', authenticateToken, async (req, res) => {
  try {
    const { id: service_id, userId: user_id } = req.params;
    const { role, tenant_id } = req.user;

    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const permission = await Permission.findOne({
      where: { user_id, service_id, tenant_id }
    });

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await permission.destroy();

    res.json({ message: 'Permission removed' });
  } catch (error) {
    console.error('Error removing permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
