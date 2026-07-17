const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpensesByCategory,
  getExpensesByStaff
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

const expenseValidation = [
  body('expenseDate').optional().isISO8601().withMessage('Invalid date'),
  body('category').isIn(['Rent','Electricity','Internet','Salary','Stationery','Maintenance','Marketing','Travel','Food & Refreshments','Other']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  // body('description').trim().notEmpty().withMessage('Description required').isLength({ max: 500 }),
  body('paymentMode').isIn(['Cash','UPI','Card','Bank Transfer','Cheque']).withMessage('Invalid payment mode'),
  body('staffId').optional().isMongoId().withMessage('Invalid staff ID'),
  body('paidTo').optional().trim().isLength({ max: 200 }),
  body('receiptNumber').optional().trim(),
  body('remarks').optional().trim().isLength({ max: 500 })
];

router.use(protect);

router.get('/stats/summary', getExpenseStats);
router.get('/category/:category', getExpensesByCategory);
router.get('/staff/:staffId', getExpensesByStaff);

router.route('/')
  .post(expenseValidation, createExpense)
  .get(getExpenses);

router.route('/:id')
  .get(getExpense)
  .put(expenseValidation, updateExpense)
  .delete(authorize('Super Admin'), deleteExpense);

module.exports = router;