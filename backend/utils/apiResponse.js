/**
 * Standard API Response Utility
 * Provides consistent JSON response format across the application
 */

class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {*} data - Response data
   * @param {number} statusCode - HTTP status code
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    // Include pagination info if present in data
    if (data && data.pagination) {
      response.pagination = data.pagination;
      response.count = data.count;
      response.total = data.total;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Created response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {*} data - Created resource data
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, message, data, 201);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Validation errors or additional error details
   */
  static error(res, message = 'Something went wrong', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && errors && errors.stack) {
      response.stack = errors.stack;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} errors - Validation errors
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, message, 409);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {*} errors - Validation errors array
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 422, errors);
  }

  /**
   * Server error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} error - Error object
   */
  static serverError(res, message = 'Internal server error', error = null) {
    return this.error(res, message, 500, error);
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {number} total - Total count of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {string} message - Success message
   */
  static paginated(res, data, total, page, limit, message = 'Data retrieved successfully') {
    const totalPages = Math.ceil(total / limit);
    
    const responseData = {
      data,
      count: data.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    };

    return this.success(res, message, responseData);
  }
}

module.exports = ApiResponse;