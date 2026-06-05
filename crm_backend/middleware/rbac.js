const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const checkUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'] || (req.body && req.body.user_id) || (req.query && req.query.user_id);
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required. Missing x-user-id header.' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const permit = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: `Access Denied. Role '${req.user.role}' does not have permission.` });
    }
  };
};

const preventAuditorWrite = (req, res, next) => {
  if (req.user && req.user.role === 'auditor') {
    const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    if (isWrite) {
      return res.status(403).json({ message: 'Access Denied. Auditors cannot modify data.' });
    }
  }
  next();
};

const logActivity = async (userId, action, details, companyId) => {
  try {
    await AuditLog.create({
      performed_by: userId,
      action,
      details,
      company_id: companyId || null
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = { checkUser, permit, preventAuditorWrite, logActivity };
