/**
 * Application Constants
 */

const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin'
};

const USER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

const STUDENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

const BATCH_STATUS = {
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  UPCOMING: 'Upcoming',
  CANCELLED: 'Cancelled'
};

const ENROLLMENT_STATUS = {
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped'
};

const PAYMENT_MODES = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque'
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500
};

const DATE_FORMATS = {
  SHORT: 'short',
  LONG: 'long',
  ISO: 'iso',
  DATETIME: 'datetime',
  TIME: 'time'
};

const FILE_TYPES = {
  IMAGES: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
};

const FILE_SIZE_LIMITS = {
  PHOTO: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
};

const REPORT_TYPES = {
  PENDING_FEES: 'pending-fees',
  STUDENT_LEDGER: 'student-ledger',
  PAYMENT_HISTORY: 'payment-history',
  BATCH_REVENUE: 'batch-revenue',
  MONTHLY_COLLECTION: 'monthly-collection',
  DAILY_COLLECTION: 'daily-collection',
  STUDENT_WISE: 'student-wise-collection',
  BATCH_WISE: 'batch-wise-collection'
};

const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf'
};

const RECEIPT_PREFIX = 'RCP';
const STUDENT_ID_PREFIX = 'STU';

const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email',
  INVALID_MOBILE: 'Please provide a valid 10-digit mobile number',
  INVALID_ID: 'Invalid ID format',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Cannot exceed ${max} characters`,
  INVALID_DATE: 'Please provide a valid date',
  FUTURE_DATE: 'Date must be in the future',
  PAST_DATE: 'Date must be in the past',
  INVALID_AMOUNT: 'Amount must be a positive number',
  INVALID_STATUS: 'Invalid status value',
  INVALID_ROLE: 'Invalid role value',
  PASSWORD_MISMATCH: 'Passwords do not match'
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this route',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  DUPLICATE: 'Resource already exists',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_INACTIVE: 'Your account is inactive',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  BATCH_FULL: 'Batch is full. Maximum student limit reached',
  PAYMENT_EXCEEDS: 'Payment amount exceeds pending amount',
  ENROLLMENT_EXISTS: 'Student is already enrolled in this batch',
  CANNOT_DELETE: 'Cannot delete resource with active dependencies'
};

const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PAYMENT_RECORDED: 'Payment recorded successfully',
  ENROLLMENT_COMPLETED: 'Enrollment completed successfully',
  RECEIPT_GENERATED: 'Receipt generated successfully'
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  STUDENT_STATUS,
  BATCH_STATUS,
  ENROLLMENT_STATUS,
  PAYMENT_MODES,
  PAGINATION,
  HTTP_STATUS,
  DATE_FORMATS,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  REPORT_TYPES,
  EXPORT_FORMATS,
  RECEIPT_PREFIX,
  STUDENT_ID_PREFIX,
  VALIDATION_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};