const { validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors for better readability
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

// Custom validators
const customValidators = {
  // Check if value is a valid MongoDB ObjectId
  isValidObjectId: (value) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  },

  // Check if date is valid and in the future
  isFutureDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    if (date <= new Date()) {
      throw new Error('Date must be in the future');
    }
    return true;
  },

  // Check if date is valid and in the past
  isPastDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    if (date >= new Date()) {
      throw new Error('Date must be in the past');
    }
    return true;
  },

  // Check if end date is after start date
  isEndDateAfterStartDate: (endDate, { req }) => {
    if (new Date(endDate) <= new Date(req.body.startDate)) {
      throw new Error('End date must be after start date');
    }
    return true;
  },

  // Check if value is a valid mobile number
  isValidMobile: (value) => {
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(value)) {
      throw new Error('Please provide a valid 10-digit mobile number');
    }
    return true;
  },

  // Check if value is a valid email
  isValidEmail: (value) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  },

  // Sanitize and trim string
  sanitizeString: (value) => {
    return value ? value.trim().replace(/\s+/g, ' ') : value;
  },

  // Check if amount is valid (positive number with max 2 decimal places)
  isValidAmount: (value) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      throw new Error('Amount must be a positive number');
    }
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      throw new Error('Amount can have maximum 2 decimal places');
    }
    return true;
  }
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  if (req.body) {
    // Sanitize all string fields
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  if (req.query) {
    // Sanitize all query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

// Pagination middleware
const pagination = (req, res, next) => {
  req.query.page = parseInt(req.query.page) || 1;
  req.query.limit = parseInt(req.query.limit) || 10;
  
  // Ensure page and limit are valid
  if (req.query.page < 1) req.query.page = 1;
  if (req.query.limit < 1) req.query.limit = 10;
  if (req.query.limit > 100) req.query.limit = 100; // Max limit
  
  next();
};

// Search middleware
const search = (allowedFields = []) => {
  return (req, res, next) => {
    if (req.query.search && allowedFields.length > 0) {
      const searchValue = req.query.search.trim();
      
      // Build search query
      req.searchQuery = {
        $or: allowedFields.map(field => ({
          [field]: { $regex: searchValue, $options: 'i' }
        }))
      };
    }
    
    next();
  };
};

// Date range middleware
const dateRange = (startField = 'startDate', endField = 'endDate') => {
  return (req, res, next) => {
    req.dateRange = {};
    
    if (req.query[startField]) {
      req.dateRange.$gte = new Date(req.query[startField]);
    }
    
    if (req.query[endField]) {
      req.dateRange.$lte = new Date(req.query[endField]);
    }
    
    if (Object.keys(req.dateRange).length === 0) {
      req.dateRange = null;
    }
    
    next();
  };
};

// Filter middleware
const filter = (allowedFilters = []) => {
  return (req, res, next) => {
    req.filters = {};
    
    allowedFilters.forEach(filterField => {
      if (req.query[filterField]) {
        req.filters[filterField] = req.query[filterField];
      }
    });
    
    if (Object.keys(req.filters).length === 0) {
      req.filters = null;
    }
    
    next();
  };
};

// Sort middleware
const sort = (defaultSort = '-createdAt') => {
  return (req, res, next) => {
    req.sortBy = req.query.sort || defaultSort;
    next();
  };
};

module.exports = {
  validate,
  customValidators,
  sanitize,
  pagination,
  search,
  dateRange,
  filter,
  sort
};