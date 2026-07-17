const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from Bearer token
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Check if user is active
      if (user.status !== 'Active') {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administrator.'
        });
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(
          user.passwordChangedAt.getTime() / 1000,
          10
        );

        // Token issued before password change
        if (decoded.iat < passwordChangedTimestamp) {
          return res.status(401).json({
            success: false,
            message: 'Password recently changed. Please login again.'
          });
        }
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your token has expired. Please login again.'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists on request (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // Check if user role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Check ownership or admin role (for updating own profile vs admin updating any)
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      // Admins can access any record
      if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
        return next();
      }

      // For non-admin users, check if they own the resource
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if the user created this resource
      if (resource.createdBy && resource.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this resource'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for authentication routes
const authLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // Clean up old entries
    for (const [key, value] of attempts.entries()) {
      if (now - value.timestamp > windowMs) {
        attempts.delete(key);
      }
    }

    // Get current attempts for this IP
    const currentAttempts = attempts.get(ip) || { count: 0, timestamp: now };

    // Reset if window has passed
    if (now - currentAttempts.timestamp > windowMs) {
      currentAttempts.count = 0;
      currentAttempts.timestamp = now;
    }

    // Check if max attempts exceeded
    if (currentAttempts.count >= maxAttempts) {
      const remainingTime = Math.ceil(
        (windowMs - (now - currentAttempts.timestamp)) / 1000 / 60
      );

      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again in ${remainingTime} minutes.`
      });
    }

    // Increment attempts
    currentAttempts.count++;
    attempts.set(ip, currentAttempts);

    next();
  };
};

// Validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}. Please provide a valid ID.`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  checkOwnership,
  authLimiter,
  validateObjectId
};