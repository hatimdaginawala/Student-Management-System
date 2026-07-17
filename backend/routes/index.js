const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const batchRoutes = require('./batchRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const paymentRoutes = require('./paymentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
// Add this with other route imports
const inquiryRoutes = require('./inquiryRoutes');

// Add this with other route mounts
router.use('/inquiries', inquiryRoutes);
// Add these lines with other route imports
const expenseRoutes = require('./expenseRoutes');
const staffRoutes = require('./staffRoutes');

// Add these lines with other route mounts
router.use('/expenses', expenseRoutes);
router.use('/staff', staffRoutes);
// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/batches', batchRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// API version and health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      batches: '/api/batches',
      enrollments: '/api/enrollments',
      payments: '/api/payments',
      dashboard: '/api/dashboard',
      reports: '/api/reports'
    }
  });
});

module.exports = router;