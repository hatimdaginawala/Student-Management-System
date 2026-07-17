const express = require('express');
const router = express.Router();
const {
  getPendingFeesReport,
  getStudentLedgerReport,
  getPaymentHistoryReport,
  getBatchRevenueReport,
  getMonthlyCollectionReport,
  getDailyCollectionReport,
  getStudentWiseCollectionReport,
  getBatchWiseCollectionReport,
  exportReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Report routes
router.get('/pending-fees', getPendingFeesReport);
router.get('/student-ledger/:studentId', getStudentLedgerReport);
router.get('/payment-history', getPaymentHistoryReport);
router.get('/batch-revenue', getBatchRevenueReport);
router.get('/monthly-collection', getMonthlyCollectionReport);
router.get('/daily-collection', getDailyCollectionReport);
router.get('/student-wise-collection', getStudentWiseCollectionReport);
router.get('/batch-wise-collection', getBatchWiseCollectionReport);

// Export routes
router.get('/export/:type', exportReport);

module.exports = router;