// Custom Error class for API errors
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle 404 errors for undefined routes
const notFound = (req, res, next) => {
  const error = new ApiError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// Development error handler
const developmentErrors = (err, req, res, next) => {
  // Don't try to set headers if they're already sent
  if (res.headersSent) {
    return next(err);
  }

  console.error('Error 💥:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Production error handler
const productionErrors = (err, req, res, next) => {
  // Don't try to set headers if they're already sent
  if (res.headersSent) {
    return next(err);
  }

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Programming or unknown errors: don't leak error details
  console.error('ERROR 💥:', err);
  
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.'
  });
};

// Handle MongoDB validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for ${field}: ${value}. Please use another value.`;
  return new ApiError(message, 400);
};

// Handle MongoDB CastError
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ApiError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => {
  return new ApiError('Invalid token. Please login again.', 401);
};

const handleJWTExpiredError = () => {
  return new ApiError('Your token has expired. Please login again.', 401);
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Don't try to set headers if they're already sent
  if (res.headersSent) {
    return next(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return developmentErrors(err, req, res, next);
  }

  let error = { ...err, message: err.message };

  // Handle specific MongoDB errors
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  productionErrors(error, req, res, next);
};

// Async handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler
};