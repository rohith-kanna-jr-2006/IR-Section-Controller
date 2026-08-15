export const ROLES = {
  ADMIN: 'ADMIN',
  ZONE_ADMIN: 'ZONE_ADMIN',
  DIVISION_ADMIN: 'DIVISION_ADMIN',
  DATA_OPERATOR: 'DATA_OPERATOR',
  VIEWER: 'VIEWER'
};

export const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    // Basic auth check
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role || (req.user.roleId && req.user.roleId.name);
    
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. Role not found.' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

export const requireScope = (entityZoneIdPath, entityDivisionIdPath) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (userRole === ROLES.ADMIN || userRole === ROLES.DATA_OPERATOR) {
      return next(); // Global access
    }

    const entityZoneId = getNestedValue(req.body, entityZoneIdPath);
    const entityDivisionId = getNestedValue(req.body, entityDivisionIdPath);

    if (userRole === ROLES.ZONE_ADMIN) {
      if (req.user.zoneId && entityZoneId && req.user.zoneId.toString() !== entityZoneId.toString()) {
        return res.status(403).json({ error: 'Access denied. Out of zone scope.' });
      }
    }

    if (userRole === ROLES.DIVISION_ADMIN) {
      if (req.user.divisionId && entityDivisionId && req.user.divisionId.toString() !== entityDivisionId.toString()) {
        return res.status(403).json({ error: 'Access denied. Out of division scope.' });
      }
    }

    next();
  };
};

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
