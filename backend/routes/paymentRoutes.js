const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  getPayment,
  getEnrollmentPayments,
  updatePayment,
  deletePayment,
  generateReceipt
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createPaymentValidation = [
  body('enrollmentId')
    .notEmpty()
    .withMessage('Enrollment ID is required')
    .isMongoId()
    .withMessage('Invalid enrollment ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMode')
    .isIn(['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'])
    .withMessage('Invalid payment mode'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
  body('transactionId')
    .optional({ nullable: true })
    .trim(),
  body('chequeNumber')
    .optional({ nullable: true })
    .trim(),
  body('chequeDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Please provide a valid cheque date'),
  body('bankName')
    .optional({ nullable: true })
    .trim()
];

const updatePaymentValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMode')
    .optional()
    .isIn(['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'])
    .withMessage('Invalid payment mode'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// All routes require authentication
router.use(protect);

// Payment routes
router.route('/')
  .post(createPaymentValidation, createPayment)
  .get(getPayments);

router.route('/:id')
  .get(getPayment)
  .put(updatePaymentValidation, updatePayment)
  .delete(authorize('Super Admin'), deletePayment);

// Enrollment payments route
router.get('/enrollment/:id', getEnrollmentPayments);

// Receipt generation route
router.get('/:id/receipt', generateReceipt);

module.exports = router;