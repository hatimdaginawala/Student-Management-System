const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createBatch,
  getBatches,
  getBatch,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  getBatchRevenue
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createBatchValidation = [
  body('batchName')
    .trim()
    .notEmpty()
    .withMessage('Batch name is required')
    .isLength({ max: 100 })
    .withMessage('Batch name cannot exceed 100 characters'),
  body('courseName')
    .trim()
    .notEmpty()
    .withMessage('Course name is required')
    .isLength({ max: 200 })
    .withMessage('Course name cannot exceed 200 characters'),
  body('fees')
    .isFloat({ min: 0 })
    .withMessage('Fees must be a positive number'),
  body('duration')
    .trim()
    .notEmpty()
    .withMessage('Duration is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('timing')
    .trim()
    .notEmpty()
    .withMessage('Timing is required'),
  body('faculty')
    .optional({ nullable: true })
    .trim(),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('maxStudents')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum students must be a positive number'),
  body('roomNumber')
    .optional({ nullable: true })
    .trim()
];

const updateBatchValidation = [
  body('batchName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Batch name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Batch name cannot exceed 100 characters'),
  body('courseName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Course name cannot exceed 200 characters'),
  body('fees')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fees must be a positive number'),
  body('duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Duration cannot be empty'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('timing')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timing cannot be empty'),
  body('faculty')
    .optional({ nullable: true })
    .trim(),
  body('status')
    .optional()
    .isIn(['Running', 'Completed', 'Upcoming', 'Cancelled'])
    .withMessage('Invalid status'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('maxStudents')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum students must be a positive number'),
  body('roomNumber')
    .optional({ nullable: true })
    .trim()
];

// All routes require authentication
router.use(protect);

// Batch routes
router.route('/')
  .post(createBatchValidation, createBatch)
  .get(getBatches);

router.route('/:id')
  .get(getBatch)
  .put(updateBatchValidation, updateBatch)
  .delete(authorize('Super Admin'), deleteBatch);

// Batch specific routes
router.get('/:id/students', getBatchStudents);
router.get('/:id/revenue', getBatchRevenue);

module.exports = router;