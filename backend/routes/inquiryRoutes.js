const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiry,
  deleteInquiry,
  updateInquiryStatus,
  convertToStudent,
  getInquiryStats
} = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules


const updateInquiryValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 }),
  body('contactNumber')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid 10-digit contact number required'),
  body('parentContact')
    .optional({ nullable: true })
    .matches(/^[0-9]{10}$/),
  body('qualification')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }),
  body('courseName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }),
  body('comments')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }),
  body('inquiryDate')
    .optional()
    .isISO8601(),
  body('status')
    .optional()
    .isIn(['Inquired', 'Joined', 'Cancelled']),
  body('address')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }),
  body('followUpDate')
    .optional({ nullable: true })
    .isISO8601(),
  body('followUpNotes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
];

// All routes require authentication
router.use(protect);

// Statistics route (before /:id routes)
router.get('/stats/summary', getInquiryStats);

// CRUD routes
router.route('/')
  .post(createInquiry)
  .get(getInquiries);

router.route('/:id')
  .get(getInquiry)
  .put( updateInquiry)
  .delete(authorize('Super Admin'), deleteInquiry);

// Status update
router.patch('/:id/status', updateInquiryStatus);

// Convert inquiry to student
router.post('/:id/convert', convertToStudent);

module.exports = router;