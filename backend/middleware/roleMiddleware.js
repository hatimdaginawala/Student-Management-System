const User = require('../models/User');

// Check if user has required role
const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      // User should be available from auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get fresh user data from database
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive'
        });
      }

      // Check if user role is allowed
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // Add fresh user data to request
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Super Admin privileges required.'
  });
};

// Check if user is Admin or Super Admin
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin privileges required.'
  });
};

// Check if user can manage students
const canManageStudents = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to manage students.'
  });
};

// Check if user can manage batches
const canManageBatches = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to manage batches.'
  });
};

// Check if user can manage payments
const canManagePayments = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to manage payments.'
  });
};

// Check if user can view reports
const canViewReports = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to view reports.'
  });
};

// Check if user can access dashboard
const canAccessDashboard = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to access dashboard.'
  });
};

// Check if user can manage system settings
const canManageSettings = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Only Super Admin can manage system settings.'
  });
};

// Check if user can manage users
const canManageUsers = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Only Super Admin can manage users.'
  });
};

// Check resource ownership
const isResourceOwner = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      // Super Admin can access any resource
      if (req.user.role === 'Super Admin') {
        return next();
      }

      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user created this resource
      if (resource.createdBy && resource.createdBy.toString() === req.user.id) {
        return next();
      }

      // Admin can access resources created by any admin
      if (req.user.role === 'Admin') {
        const creator = await User.findById(resource.createdBy);
        if (creator && creator.role === 'Admin') {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkRole,
  isSuperAdmin,
  isAdmin,
  canManageStudents,
  canManageBatches,
  canManagePayments,
  canViewReports,
  canAccessDashboard,
  canManageSettings,
  canManageUsers,
  isResourceOwner
};