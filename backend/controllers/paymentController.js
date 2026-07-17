const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const { validationResult } = require('express-validator');

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      enrollmentId, 
      amount, 
      paymentMode, 
      paymentDate,
      remarks,
      transactionId,
      chequeNumber,
      chequeDate,
      bankName
    } = req.body;

    // Check if enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('studentId', 'name')
      .populate('batchId', 'batchName');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if enrollment is active
    if (enrollment.status === 'Dropped') {
      return res.status(400).json({
        success: false,
        message: 'Cannot accept payment for dropped enrollment'
      });
    }

    // Check if payment exceeds pending amount
    const pendingAmount = await enrollment.calculatePendingAmount();
    
    if (amount > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds pending amount (${pendingAmount})`
      });
    }

    // Create payment
    const payment = await Payment.create({
      enrollmentId,
      amount,
      paymentMode,
      paymentDate: paymentDate || Date.now(),
      remarks,
      transactionId,
      chequeNumber,
      chequeDate,
      bankName,
      receivedBy: req.user.id
    });

    // Check if enrollment is now fully paid
    const updatedPendingAmount = await enrollment.calculatePendingAmount();
    
    if (updatedPendingAmount <= 0 && enrollment.status === 'Running') {
      enrollment.status = 'Completed';
      enrollment.completionDate = new Date();
      await enrollment.save();
    }

    await payment.populate([
      {
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name mobile studentId'
          },
          {
            path: 'batchId',
            select: 'batchName courseName'
          }
        ]
      },
      {
        path: 'receivedBy',
        select: 'name'
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        enrollmentStatus: enrollment.status,
        pendingAmount: Math.max(0, updatedPendingAmount)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      paymentMode, 
      startDate, 
      endDate,
      enrollmentId,
      receivedBy,
      sort = '-paymentDate',
      minAmount,
      maxAmount
    } = req.query;

    const query = {};

    // Filter by payment mode
    if (paymentMode) {
      query.paymentMode = paymentMode;
    }

    // Filter by enrollment
    if (enrollmentId) {
      query.enrollmentId = enrollmentId;
    }

    // Filter by receiver
    if (receivedBy) {
      query.receivedBy = receivedBy;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name mobile studentId'
          },
          {
            path: 'batchId',
            select: 'batchName courseName'
          }
        ]
      })
      .populate('receivedBy', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Calculate total amount for filtered payments
    const totalAmount = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name mobile studentId email parentMobile'
          },
          {
            path: 'batchId',
            select: 'batchName courseName fees'
          }
        ]
      })
      .populate('receivedBy', 'name')
      .populate('updatedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Get enrollment details for context
    const enrollment = await Enrollment.findById(payment.enrollmentId._id);
    const pendingAmount = await enrollment.calculatePendingAmount();
    const totalPaid = await enrollment.calculateTotalPaid();

    res.status(200).json({
      success: true,
      data: {
        payment,
        enrollmentSummary: {
          finalFees: enrollment.finalFees,
          totalPaid,
          pendingAmount,
          status: enrollment.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments by enrollment
// @route   GET /api/payments/enrollment/:id
// @access  Private
exports.getEnrollmentPayments = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('studentId', 'name mobile studentId')
      .populate('batchId', 'batchName courseName');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const payments = await Payment.find({ enrollmentId: req.params.id })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = enrollment.finalFees - totalPaid;

    res.status(200).json({
      success: true,
      count: payments.length,
      data: {
        enrollment: {
          id: enrollment._id,
          student: enrollment.studentId,
          batch: enrollment.batchId,
          finalFees: enrollment.finalFees,
          discount: enrollment.discount,
          batchFees: enrollment.batchFees,
          status: enrollment.status
        },
        payments,
        summary: {
          totalPayments: payments.length,
          totalPaid,
          pendingAmount,
          paymentStatus: pendingAmount <= 0 ? 'Completed' : 
                        totalPaid > 0 ? 'Partial' : 'Unpaid'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
exports.updatePayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, paymentMode, paymentDate, remarks } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if new amount exceeds pending amount
    if (amount) {
      const enrollment = await Enrollment.findById(payment.enrollmentId);
      const pendingAmount = await enrollment.calculatePendingAmount();
      const additionalAmount = amount - payment.amount;
      
      if (additionalAmount > pendingAmount) {
        return res.status(400).json({
          success: false,
          message: `New amount exceeds pending amount by ${additionalAmount - pendingAmount}`
        });
      }

      // Track edit history
      payment.editHistory.push({
        previousAmount: payment.amount,
        newAmount: amount,
        editedBy: req.user.id,
        reason: 'Payment amount updated'
      });
    }

    // Update fields
    if (amount) payment.amount = amount;
    if (paymentMode) payment.paymentMode = paymentMode;
    if (paymentDate) payment.paymentDate = paymentDate;
    if (remarks !== undefined) payment.remarks = remarks;
    
    payment.isEdited = true;
    payment.updatedBy = req.user.id;

    await payment.save();

    // Check if enrollment status needs to be updated
    const enrollment = await Enrollment.findById(payment.enrollmentId);
    const pendingAmount = await enrollment.calculatePendingAmount();
    
    if (pendingAmount <= 0 && enrollment.status === 'Running') {
      enrollment.status = 'Completed';
      enrollment.completionDate = new Date();
      await enrollment.save();
    } else if (pendingAmount > 0 && enrollment.status === 'Completed') {
      enrollment.status = 'Running';
      enrollment.completionDate = null;
      await enrollment.save();
    }

    await payment.populate([
      {
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name mobile studentId'
          },
          {
            path: 'batchId',
            select: 'batchName courseName'
          }
        ]
      },
      {
        path: 'receivedBy',
        select: 'name'
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Super Admin
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const enrollmentId = payment.enrollmentId;

    // Delete the payment
    await Payment.findByIdAndDelete(req.params.id);

    // Check if enrollment status needs to be updated
    const enrollment = await Enrollment.findById(enrollmentId);
    const pendingAmount = await enrollment.calculatePendingAmount();
    
    if (pendingAmount > 0 && enrollment.status === 'Completed') {
      enrollment.status = 'Running';
      enrollment.completionDate = null;
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
exports.generateReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name mobile studentId email address'
          },
          {
            path: 'batchId',
            select: 'batchName courseName'
          }
        ]
      })
      .populate('receivedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Format receipt data
    const receipt = {
      receiptNumber: payment.receiptNumber,
      date: payment.paymentDate,
      student: {
        name: payment.enrollmentId.studentId.name,
        studentId: payment.enrollmentId.studentId.studentId,
        mobile: payment.enrollmentId.studentId.mobile
      },
      batch: {
        name: payment.enrollmentId.batchId.batchName,
        course: payment.enrollmentId.batchId.courseName
      },
      payment: {
        amount: payment.amount,
        mode: payment.paymentMode,
        remarks: payment.remarks
      },
      receivedBy: payment.receivedBy.name,
      institute: {
        name: process.env.APP_NAME || 'Institute Name',
        receiptFooter: 'Thank you for your payment. This is a computer-generated receipt.'
      }
    };

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};