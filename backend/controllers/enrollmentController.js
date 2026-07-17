const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// @desc    Create new enrollment
// @route   POST /api/enrollments
// @access  Private
exports.createEnrollment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { studentId, batchId, discount = 0, joiningDate, remarks } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if batch exists and is running/upcoming
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    if (batch.status === 'Cancelled' || batch.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot enroll in a ${batch.status.toLowerCase()} batch`
      });
    }

    // Check max students limit
    if (batch.maxStudents) {
      const currentEnrollments = await Enrollment.countDocuments({
        batchId,
        status: { $ne: 'Dropped' }
      });
      
      if (currentEnrollments >= batch.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'Batch is full. Maximum student limit reached.'
        });
      }
    }

    // Check for duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      batchId,
      status: { $ne: 'Dropped' }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this batch'
      });
    }

    // Create enrollment with fee snapshot
    const enrollment = await Enrollment.create({
      studentId,
      batchId,
      batchFees: batch.fees, // Snapshot of current batch fees
      discount,
      finalFees: batch.fees - discount,
      joiningDate: joiningDate || Date.now(),
      remarks,
      createdBy: req.user.id
    });

    // Populate references for response
    await enrollment.populate([
      {
        path: 'studentId',
        select: 'name mobile studentId'
      },
      {
        path: 'batchId',
        select: 'batchName courseName timing'
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private
exports.getEnrollments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      batchId,
      sort = '-createdAt',
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by batch
    if (batchId) {
      query.batchId = batchId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.joiningDate = {};
      if (startDate) query.joiningDate.$gte = new Date(startDate);
      if (endDate) query.joiningDate.$lte = new Date(endDate);
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'studentId',
        select: 'name mobile studentId email'
      })
      .populate({
        path: 'batchId',
        select: 'batchName courseName fees timing'
      })
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get payment summary for each enrollment
    const enrollmentsWithPayments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          ...enrollment.toJSON(),
          paymentSummary: {
            totalPaid,
            pendingAmount,
            paymentStatus: pendingAmount <= 0 ? 'Paid' : 
                          totalPaid > 0 ? 'Partial' : 'Unpaid'
          }
        };
      })
    );

    const total = await Enrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: enrollmentsWithPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate({
        path: 'studentId',
        select: 'name mobile studentId email parentMobile address'
      })
      .populate({
        path: 'batchId',
        select: 'batchName courseName fees timing faculty duration'
      })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get payment history
    const payments = await Payment.find({ enrollmentId: enrollment._id })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = enrollment.finalFees - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        payments,
        paymentSummary: {
          finalFees: enrollment.finalFees,
          discount: enrollment.discount,
          batchFees: enrollment.batchFees,
          totalPaid,
          pendingAmount,
          totalPayments: payments.length,
          paymentStatus: pendingAmount <= 0 ? 'Completed' : 
                        totalPaid > 0 ? 'Partial' : 'Unpaid'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrollments by student
// @route   GET /api/enrollments/student/:studentId
// @access  Private
exports.getStudentEnrollments = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { studentId: req.params.studentId };
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'batchId',
        select: 'batchName courseName fees timing faculty startDate endDate'
      })
      .sort({ joiningDate: -1 });

    // Get payment details for each enrollment
    const enrollmentsWithPayments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id })
          .sort({ paymentDate: -1 });
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          ...enrollment.toJSON(),
          payments: payments.slice(0, 5), // Last 5 payments
          paymentSummary: {
            totalPaid,
            pendingAmount,
            paymentStatus: pendingAmount <= 0 ? 'Paid' : 
                          totalPaid > 0 ? 'Partial' : 'Unpaid'
          }
        };
      })
    );

    // Get student details
    const student = await Student.findById(req.params.studentId)
      .select('name mobile studentId email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: {
        student,
        enrollments: enrollmentsWithPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrollments by batch
// @route   GET /api/enrollments/batch/:batchId
// @access  Private
exports.getBatchEnrollments = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'studentId',
        select: 'name mobile studentId email'
      })
      .sort({ joiningDate: -1 });

    // Get payment summary for each enrollment
    const enrollmentsWithPayments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          ...enrollment.toJSON(),
          paymentSummary: {
            totalPaid,
            pendingAmount,
            paymentStatus: pendingAmount <= 0 ? 'Paid' : 
                          totalPaid > 0 ? 'Partial' : 'Unpaid'
          }
        };
      })
    );

    // Get batch details
    const batch = await Batch.findById(req.params.batchId)
      .select('batchName courseName fees');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: {
        batch,
        enrollments: enrollmentsWithPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private
exports.updateEnrollment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { discount, status, dropReason, remarks } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update fields
    if (discount !== undefined) {
      enrollment.discount = discount;
      enrollment.finalFees = enrollment.batchFees - discount;
    }

    if (status) {
      // Validate status transitions
      if (status === 'Dropped' && !dropReason) {
        return res.status(400).json({
          success: false,
          message: 'Drop reason is required when dropping enrollment'
        });
      }
      enrollment.status = status;
      if (status === 'Dropped') {
        enrollment.dropReason = dropReason;
        enrollment.dropDate = new Date();
      }
      if (status === 'Completed') {
        enrollment.completionDate = new Date();
      }
    }

    if (remarks !== undefined) enrollment.remarks = remarks;
    enrollment.updatedBy = req.user.id;

    await enrollment.save();

    await enrollment.populate([
      {
        path: 'studentId',
        select: 'name mobile studentId'
      },
      {
        path: 'batchId',
        select: 'batchName courseName timing'
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private/Super Admin
exports.deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if there are payments
    const paymentCount = await Payment.countDocuments({ enrollmentId: req.params.id });
    
    if (paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete enrollment with payment history. Please drop the enrollment instead.'
      });
    }

    await Enrollment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};