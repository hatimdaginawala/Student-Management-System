const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createStaff,
  getStaff,
  getSingleStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  deleteStaffPhoto,
  getStaffStats
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

const staffValidation = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile required'),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('alternateMobile').optional({ nullable: true }).matches(/^[0-9]{10}$/),
  body('address').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('designation').isIn(['Teacher','Lab Assistant','Receptionist','Accountant','Office Staff','Peon','Other']),
  body('course').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('salary').optional({ nullable: true }).isFloat({ min: 0 }),
  body('joiningDate').optional().isISO8601(),
  body('status').optional().isIn(['Active','Inactive','On Leave']),
  body('gender').optional({ nullable: true }).isIn(['Male','Female','Other']),
  body('dateOfBirth').optional({ nullable: true }).isISO8601(),
  body('aadharNumber').optional({ nullable: true }).matches(/^[0-9]{12}$/),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 1000 })
];

router.use(protect);

router.get('/stats/summary', getStaffStats);

router.route('/')
  .post(staffValidation, createStaff)
  .get(getStaff);

router.route('/:id')
  .get(getSingleStaff)
  .put(staffValidation, updateStaff)
  .delete(authorize('Super Admin'), deleteStaff);

router.patch('/:id/status', updateStaffStatus);
router.delete('/:id/photo', deleteStaffPhoto);

module.exports = router;