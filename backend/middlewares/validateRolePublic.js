const ALLOWED_ROLES = {
  user: 'user',
  moderator: 'moderator',
  viewer: 'viewer',
};

function validateRolePublic(req, res, next) {
  const { role } = req.body;

  if (!role || !Object.values(ALLOWED_ROLES).includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Allowed roles: user, moderator, viewer',
    });
  }

  next();
}

module.exports = validateRolePublic;