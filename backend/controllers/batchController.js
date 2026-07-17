const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private
exports.createBatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      batchName, 
      courseName, 
      fees, 
      duration, 
      startDate, 
      endDate, 
      timing, 
      faculty,
      description,
      maxStudents,
      roomNumber
    } = req.body;

    const batch = await Batch.create({
      batchName,
      courseName,
      fees,
      duration,
      startDate,
      endDate,
      timing,
      faculty,
      description,
      maxStudents,
      roomNumber,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
exports.getBatches = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sort = '-createdAt',
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by batch name or course name
    if (search) {
      query.$or = [
        { batchName: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { faculty: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const batches = await Batch.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get enrolled students count for each batch
    const batchesWithCount = await Promise.all(
      batches.map(async (batch) => {
        const enrolledCount = await Enrollment.countDocuments({
          batchId: batch._id,
          status: { $ne: 'Dropped' }
        });
        
        return {
          ...batch.toJSON(),
          enrolledStudents: enrolledCount
        };
      })
    );

    const total = await Batch.countDocuments(query);

    res.status(200).json({
      success: true,
      count: batches.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: batchesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
exports.getBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'enrollments',
        populate: {
          path: 'studentId',
          select: 'name mobile studentId'
        }
      });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get revenue details
    const totalRevenue = await batch.getTotalRevenue();
    const enrolledCount = batch.enrollments.filter(
      e => e.status !== 'Dropped'
    ).length;

    res.status(200).json({
      success: true,
      data: {
        batch,
        stats: {
          enrolledStudents: enrolledCount,
          totalRevenue,
          activeEnrollments: batch.enrollments.filter(e => e.status === 'Running').length,
          completedEnrollments: batch.enrollments.filter(e => e.status === 'Completed').length,
          droppedEnrollments: batch.enrollments.filter(e => e.status === 'Dropped').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private
exports.updateBatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updateFields = {};
    const allowedFields = [
      'batchName', 'courseName', 'fees', 'duration', 
      'startDate', 'endDate', 'timing', 'faculty', 
      'status', 'description', 'maxStudents', 'roomNumber'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    updateFields.updatedBy = req.user.id;

    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private/Super Admin
exports.deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if batch has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      batchId: req.params.id,
      status: 'Running'
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch with active enrollments. Please drop or complete enrollments first.'
      });
    }

    // Delete all enrollments and payments for this batch
    const enrollments = await Enrollment.find({ batchId: req.params.id });
    for (const enrollment of enrollments) {
      await Payment.deleteMany({ enrollmentId: enrollment._id });
    }
    await Enrollment.deleteMany({ batchId: req.params.id });

    await Batch.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Batch and associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch students
// @route   GET /api/batches/:id/students
// @access  Private
exports.getBatchStudents = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { batchId: req.params.id };
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'studentId',
        select: 'name mobile studentId email parentMobile'
      })
      .sort({ joiningDate: -1 });

    // Get payment details for each enrollment
    const studentsWithPayments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        return {
          enrollment: enrollment,
          student: enrollment.studentId,
          paymentSummary: {
            finalFees: enrollment.finalFees,
            totalPaid,
            pendingAmount: enrollment.finalFees - totalPaid
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithPayments.length,
      data: studentsWithPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch revenue
// @route   GET /api/batches/:id/revenue
// @access  Private
exports.getBatchRevenue = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const enrollments = await Enrollment.find({ 
      batchId: req.params.id,
      status: { $ne: 'Dropped' }
    });

    let totalExpectedFees = 0;
    let totalCollected = 0;

    const revenueDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id })
          .populate('receivedBy', 'name')
          .sort({ paymentDate: -1 });

        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        totalExpectedFees += enrollment.finalFees;
        totalCollected += paidAmount;

        return {
          enrollmentId: enrollment._id,
          student: enrollment.studentId,
          finalFees: enrollment.finalFees,
          paidAmount,
          pendingAmount: enrollment.finalFees - paidAmount,
          payments
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        batch: {
          name: batch.batchName,
          course: batch.courseName,
          fees: batch.fees
        },
        summary: {
          totalStudents: enrollments.length,
          totalExpectedFees,
          totalCollected,
          totalPending: totalExpectedFees - totalCollected,
          collectionPercentage: totalExpectedFees > 0 
            ? ((totalCollected / totalExpectedFees) * 100).toFixed(2) 
            : 0
        },
        revenueDetails
      }
    });
  } catch (error) {
    next(error);
  }
};