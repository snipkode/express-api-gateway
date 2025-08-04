function checkRole(allowedRoles = []) {
  return function (req, res, next) {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role access' });
    }

    next();
  };
}

module.exports = checkRole;
