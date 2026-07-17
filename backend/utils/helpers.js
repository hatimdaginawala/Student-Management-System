/**
 * Utility Helper Functions
 */

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random number
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
const generateRandomNumber = (min = 1000, max = 9999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @param {string} format - Format type (short, long, iso)
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    
    case 'long':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    
    case 'iso':
      return d.toISOString().split('T')[0];
    
    case 'datetime':
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'time':
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    default:
      return d.toISOString();
  }
};

/**
 * Format currency to Indian format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

/**
 * Get date range
 * @param {string} period - Period (today, week, month, year)
 * @returns {Object} Start and end dates
 */
const getDateRange = (period = 'month') => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      break;

    case 'yesterday':
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      break;

    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      break;

    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return { startDate, endDate };
};

/**
 * Generate receipt number
 * @param {string} prefix - Prefix for receipt
 * @returns {string} Generated receipt number
 */
const generateReceiptNumber = (prefix = 'RCP') => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = generateRandomNumber(1000, 9999);
  
  return `${prefix}${year}${month}${day}${random}`;
};

/**
 * Generate student ID
 * @returns {string} Generated student ID
 */
const generateStudentId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = generateRandomNumber(100, 999);
  
  return `STU${year}${month}${random}`;
};

/**
 * Calculate outstanding amount
 * @param {number} totalFees - Total fees
 * @param {Array} payments - Array of payment objects
 * @returns {number} Outstanding amount
 */
const calculateOutstanding = (totalFees, payments = []) => {
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  return Math.max(0, totalFees - totalPaid);
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrevious: startIndex > 0
    }
  };
};

/**
 * Remove sensitive fields from object
 * @param {Object} obj - Object to sanitize
 * @param {Array} fieldsToRemove - Fields to remove
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, fieldsToRemove = ['password', '__v']) => {
  if (!obj) return obj;
  
  const sanitized = { ...obj };
  fieldsToRemove.forEach(field => {
    delete sanitized[field];
  });
  
  return sanitized;
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted array
 */
const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'desc') {
      return a[key] < b[key] ? 1 : -1;
    }
    return a[key] > b[key] ? 1 : -1;
  });
};

/**
 * Calculate age from date
 * @param {Date} date - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (date) => {
  const today = new Date();
  const birthDate = new Date(date);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if date is within range
 * @param {Date} date - Date to check
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} Is within range
 */
const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  return checkDate >= new Date(startDate) && checkDate <= new Date(endDate);
};

/**
 * Get month name
 * @param {number} month - Month number (0-11)
 * @returns {string} Month name
 */
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} Is empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  formatDate,
  formatCurrency,
  calculatePercentage,
  getDateRange,
  generateReceiptNumber,
  generateStudentId,
  calculateOutstanding,
  paginateArray,
  sanitizeObject,
  groupBy,
  sortBy,
  calculateAge,
  isDateInRange,
  getMonthName,
  toTitleCase,
  getFileExtension,
  isEmpty
};