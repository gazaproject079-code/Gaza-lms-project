const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Ensure permissions object exists for admin users
    if (user.role === 'instructor' && !user.permissions) {
      user.permissions = {
        canManageAllCourses: true,
        canManageCategories: true,
        canManageStudents: true,
        canManageCertificates: true,
        canViewFeedback: true
      };
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!['instructor', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};


const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

// Permission checking middleware
const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    // SuperAdmin always has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has permissions object
    const permissions = req.user.permissions || {};

    // Check if the specific permission is granted
    if (permissions[permissionKey] === true) {
      return next();
    }

    return res.status(403).json({
      error: 'You do not have permission to perform this action',
      requiredPermission: permissionKey
    });
  };
};

// Specific permission checkers
const canManageAllCourses = checkPermission('canManageAllCourses');
const canManageCategories = checkPermission('canManageCategories');
const canManageStudents = checkPermission('canManageStudents');
const canManageCertificates = checkPermission('canManageCertificates');
const canViewFeedback = checkPermission('canViewFeedback');

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,

  requireStudent,
  checkPermission,
  canManageAllCourses,
  canManageCategories,
  canManageStudents,
  canManageCertificates,
  canViewFeedback
};


