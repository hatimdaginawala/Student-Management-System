/**
 * Logger Utility
 * Provides consistent logging across the application
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaString = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaString}`;
};

// Write to log file
const writeToFile = (message) => {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `${date}.log`);
  
  fs.appendFile(logFile, message + '\n', (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
};

// Logger class
class Logger {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  static error(message, meta = {}) {
    const formattedMessage = formatMessage(LOG_LEVELS.ERROR, message, meta);
    console.error(formattedMessage);
    writeToFile(formattedMessage);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  static warn(message, meta = {}) {
    const formattedMessage = formatMessage(LOG_LEVELS.WARN, message, meta);
    console.warn(formattedMessage);
    writeToFile(formattedMessage);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  static info(message, meta = {}) {
    const formattedMessage = formatMessage(LOG_LEVELS.INFO, message, meta);
    console.log(formattedMessage);
    writeToFile(formattedMessage);
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  static debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = formatMessage(LOG_LEVELS.DEBUG, message, meta);
      console.debug(formattedMessage);
      writeToFile(formattedMessage);
    }
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  static httpRequest(req, res, responseTime) {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
    const meta = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : null
    };

    this.info(message, meta);
  }

  /**
   * Log database operation
   * @param {string} operation - Database operation name
   * @param {Object} details - Operation details
   */
  static database(operation, details = {}) {
    this.debug(`Database ${operation}`, details);
  }

  /**
   * Log authentication event
   * @param {string} event - Authentication event
   * @param {Object} user - User object
   */
  static auth(event, user = {}) {
    const message = `Auth: ${event}`;
    const meta = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    this.info(message, meta);
  }

  /**
   * Log payment event
   * @param {string} event - Payment event
   * @param {Object} details - Payment details
   */
  static payment(event, details = {}) {
    const message = `Payment: ${event}`;
    this.info(message, details);
  }
}

module.exports = Logger;