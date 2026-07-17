const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePasswordValidation, changePassword);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, resetPassword);
router.get('/logout', protect, logout);

module.exports = router;