// Audit logging middleware
const auditLogger = (action, resourceType) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditEntry = {
          timestamp: new Date(),
          user: req.user ? {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          } : null,
          action: action,
          resourceType: resourceType,
          resourceId: req.params.id || null,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          requestBody: sanitizeRequestBody(req.body),
          responseStatus: res.statusCode
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Audit Log:', JSON.stringify(auditEntry, null, 2));
        }
      }

      // Call original send with proper binding
      return originalSend.call(this, data);
    };

    next();
  };
};

// Sanitize request body to remove sensitive data
const sanitizeRequestBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

// Track user activity
const activityTracker = (req, res, next) => {
  const start = Date.now();

  // Log request start
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Started`);
  }

  // Track response - use 'finish' event safely
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 400) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
};

// Request context middleware
const requestContext = (req, res, next) => {
  // Add request ID for tracking
  req.requestId = generateRequestId();
  
  // Add request start time
  req.requestTime = new Date();
  
  // Only set header if not already sent
  if (!res.headersSent) {
    res.setHeader('X-Request-ID', req.requestId);
  }
  
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${randomStr}`;
};

// Response time middleware
const responseTime = (req, res, next) => {
  const start = process.hrtime();

  // Use 'finish' event safely
  res.on('finish', () => {
    if (!res.headersSent) {
      const diff = process.hrtime(start);
      const time = diff[0] * 1e3 + diff[1] * 1e-6;
      res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
    }
  });

  next();
};

module.exports = {
  auditLogger,
  activityTracker,
  requestContext,
  responseTime
};