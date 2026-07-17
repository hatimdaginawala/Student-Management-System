const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
  getProfile,
  updateProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Super Admin', 'Admin'])
    .withMessage('Invalid role')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('role')
    .optional()
    .isIn(['Super Admin', 'Admin'])
    .withMessage('Invalid role')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number')
];

const resetPasswordValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// All routes require authentication
router.use(protect);

// Profile routes (accessible by all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);

// Admin management routes (Super Admin only)
router.route('/')
  .post(authorize('Super Admin'), createUserValidation, createUser)
  .get(authorize('Super Admin'), getUsers);

router.route('/:id')
  .get(authorize('Super Admin'), getUser)
  .put(authorize('Super Admin'), updateUserValidation, updateUser)
  .delete(authorize('Super Admin'), deleteUser);

router.patch('/status/:id', authorize('Super Admin'), updateUserStatus);
router.post('/reset-password', authorize('Super Admin'), resetPasswordValidation, resetUserPassword);

module.exports = router;