const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createEnrollment,
  getEnrollments,
  getEnrollment,
  getStudentEnrollments,
  getBatchEnrollments,
  updateEnrollment,
  deleteEnrollment
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createEnrollmentValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

const updateEnrollmentValidation = [
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('status')
    .optional()
    .isIn(['Running', 'Completed', 'Dropped'])
    .withMessage('Invalid status'),
  body('dropReason')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Drop reason cannot exceed 500 characters'),
  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// All routes require authentication
router.use(protect);

// Enrollment routes
router.route('/')
  .post(createEnrollmentValidation, createEnrollment)
  .get(getEnrollments);

router.route('/:id')
  .get(getEnrollment)
  .put(updateEnrollmentValidation, updateEnrollment)
  .delete(authorize('Super Admin'), deleteEnrollment);

// Student and Batch specific enrollment routes
router.get('/student/:studentId', getStudentEnrollments);
router.get('/batch/:batchId', getBatchEnrollments);

module.exports = router;