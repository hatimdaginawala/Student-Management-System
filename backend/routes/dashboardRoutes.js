const express = require('express');
const router = express.Router();
const {
  getDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Dashboard route
router.get('/', getDashboard);

module.exports = router;