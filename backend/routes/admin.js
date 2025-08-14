const express = require('express');
const router = express.Router();
const { Tenant, User, Service } = require('../models');
const { authenticateToken } = require('../middlewares/auth');
const { superadminOnly } = require('../middlewares/signUpValidation');
const checkRole = require('../middlewares/checkRole');

// POST /admin/tenants
router.post('/tenants', authenticateToken, superadminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tenant name is required' });
    }

    const existingTenant = await Tenant.findOne({
      where: { name }
    });

    if (existingTenant) {
      return res.status(409).json({ error: 'Tenant name already exists' });
    }

    const tenant = await Tenant.create({ name });

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/tenants
router.get('/tenants', authenticateToken, superadminOnly, async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      attributes: ['id', 'name']
    });
    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/users
router.get('/users', authenticateToken, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const users = await User.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'username', 'role']
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/users/:tenantId
router.get('/users/:tenantId', authenticateToken, superadminOnly, async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (req.user.tenant_id !== 1) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this tenant' });
    }

    const users = await User.findAll({
      where: { tenant_id: tenantId },
      include: [{
        model: Tenant,
        attributes: ['name']
      }],
      attributes: ['id', 'username', 'role']
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        tenant_name: user.Tenant.name
      }))
    });
  } catch (error) {
    console.error('Error fetching users for tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/users/:tenantId/role
router.post('/users/:tenantId/role', authenticateToken, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const { userId, role } = req.body;

    if (!userId || !role) return res.status(400).json({ error: 'Missing fields' });

    const roleToCreate = req.body.role ? req.body.role.toLowerCase() : 'user';

    switch (req.user.role) {
      case 'superadmin':
        break;
      case 'admin':
        if (roleToCreate === 'superadmin') {
          return res.status(403).json({ error: 'Forbidden: Admins cannot update role users to Superadmin' });
        }
        break;
      default:
        return res.status(403).json({ error: 'Forbidden: Invalid role for this operation' });
    }

    const user = await User.findOne({ where: { id: userId, tenant_id: tenantId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /admin/tenants/:id/status
router.patch('/tenants/:id/status', authenticateToken, superadminOnly, async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "disabled"' });
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    tenant.status = status;
    await tenant.save();

    res.json({ message: `Tenant status updated to ${status}` });
  } catch (error) {
    console.error('Error updating tenant status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
