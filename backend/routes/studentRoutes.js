const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentLedger,
  updateCertificateStatus,
  getStudentsByCertificateStatus,
  getCertificateStats,
  deleteStudentPhoto
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createStudentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('parentMobile')
    .optional({ nullable: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('address')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('fatherName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Father's name cannot exceed 100 characters"),
  body('motherName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Mother's name cannot exceed 100 characters"),
  body('fatherOccupation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Father's occupation cannot exceed 100 characters"),
  body('motherOccupation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Mother's occupation cannot exceed 100 characters"),
  body('aadharNumber')
    .optional({ nullable: true })
    .matches(/^[0-9]{12}$/)
    .withMessage('Please provide a valid 12-digit Aadhar number'),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateStudentValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('parentMobile')
    .optional({ nullable: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('address')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('fatherName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }),
  body('motherName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }),
  body('fatherOccupation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }),
  body('motherOccupation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }),
  body('aadharNumber')
    .optional({ nullable: true })
    .matches(/^[0-9]{12}$/)
    .withMessage('Please provide a valid 12-digit Aadhar number'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Invalid status'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const certificateStatusValidation = [
  body('certificateStatus')
    .isIn(['Certificate Pending', 'Applied', 'Received'])
    .withMessage('Invalid certificate status'),
  body('certificateNumber')
    .optional({ nullable: true })
    .trim()
];

// All routes require authentication
router.use(protect);

// Certificate statistics route (must be before /:id routes)
router.get('/certificate/stats', getCertificateStats);

// Certificate status filter route (must be before /:id routes)
router.get('/certificate/status/:status', getStudentsByCertificateStatus);

// Student CRUD routes
router.route('/')
  .post(createStudentValidation, createStudent)
  .get(getStudents);

router.route('/:id')
  .get(getStudent)
  .put(updateStudentValidation, updateStudent)
  .delete(authorize('Super Admin', 'Admin'), deleteStudent);

// Student photo route
router.delete('/:id/photo', deleteStudentPhoto);

// Student ledger route
router.get('/:id/ledger', getStudentLedger);

// Certificate status update route
router.patch('/:id/certificate', certificateStatusValidation, updateCertificateStatus);

module.exports = router;