const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Get pending fees report
// @route   GET /api/reports/pending-fees
// @access  Private
exports.getPendingFeesReport = async (req, res, next) => {
  try {
    const { batchId, minAmount } = req.query;

    const query = { status: { $ne: 'Dropped' } };
    if (batchId) query.batchId = batchId;

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'name mobile studentId')
      .populate('batchId', 'batchName courseName');

    let pendingFeesList = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          student: enrollment.studentId,
          batch: enrollment.batchId,
          finalFees: enrollment.finalFees,
          totalPaid,
          pendingAmount,
          lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null
        };
      })
    );

    // Filter by minimum pending amount
    if (minAmount) {
      pendingFeesList = pendingFeesList.filter(item => item.pendingAmount >= parseFloat(minAmount));
    }

    // Sort by pending amount (highest first)
    pendingFeesList.sort((a, b) => b.pendingAmount - a.pendingAmount);

    const totalPending = pendingFeesList.reduce((sum, item) => sum + item.pendingAmount, 0);

    res.status(200).json({
      success: true,
      count: pendingFeesList.length,
      totalPending,
      data: pendingFeesList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student ledger report
// @route   GET /api/reports/student-ledger/:studentId
// @access  Private
exports.getStudentLedgerReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const enrollmentQuery = { studentId: req.params.studentId };
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('batchId', 'batchName courseName');

    const ledger = await Promise.all(
      enrollments.map(async (enrollment) => {
        const paymentQuery = { enrollmentId: enrollment._id };
        
        // Apply date filters
        if (startDate || endDate) {
          paymentQuery.paymentDate = {};
          if (startDate) paymentQuery.paymentDate.$gte = new Date(startDate);
          if (endDate) paymentQuery.paymentDate.$lte = new Date(endDate);
        }

        const payments = await Payment.find(paymentQuery)
          .populate('receivedBy', 'name')
          .sort({ paymentDate: 1 });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          enrollment: {
            batchName: enrollment.batchId.batchName,
            courseName: enrollment.batchId.courseName,
            batchFees: enrollment.batchFees,
            discount: enrollment.discount,
            finalFees: enrollment.finalFees,
            joiningDate: enrollment.joiningDate,
            status: enrollment.status
          },
          transactions: payments.map(p => ({
            date: p.paymentDate,
            receiptNumber: p.receiptNumber,
            amount: p.amount,
            mode: p.paymentMode,
            remarks: p.remarks,
            receivedBy: p.receivedBy.name
          })),
          summary: {
            totalFees: enrollment.finalFees,
            totalPaid,
            balance: enrollment.finalFees - totalPaid
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        student: {
          name: student.name,
          studentId: student.studentId,
          mobile: student.mobile,
          email: student.email
        },
        ledger,
        overallSummary: {
          totalFees: ledger.reduce((sum, l) => sum + l.summary.totalFees, 0),
          totalPaid: ledger.reduce((sum, l) => sum + l.summary.totalPaid, 0),
          totalBalance: ledger.reduce((sum, l) => sum + l.summary.balance, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history report
// @route   GET /api/reports/payment-history
// @access  Private
exports.getPaymentHistoryReport = async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentMode, 
      receivedBy,
      groupBy = 'day' // day, month, year
    } = req.query;

    const query = {};

    // Date filters
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    if (paymentMode) query.paymentMode = paymentMode;
    if (receivedBy) query.receivedBy = receivedBy;

    const payments = await Payment.find(query)
      .populate({
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'name studentId mobile'
          },
          {
            path: 'batchId',
            select: 'batchName courseName'
          }
        ]
      })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    // Group payments
    const groupedData = {};
    payments.forEach(payment => {
      let key;
      const date = new Date(payment.paymentDate);
      
      switch(groupBy) {
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          count: 0,
          total: 0,
          payments: []
        };
      }

      groupedData[key].count++;
      groupedData[key].total += payment.amount;
      groupedData[key].payments.push(payment);
    });

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      averageAmount: payments.length > 0 
        ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
        : 0
    };

    // Payment mode summary
    const modeSummary = {};
    payments.forEach(p => {
      if (!modeSummary[p.paymentMode]) {
        modeSummary[p.paymentMode] = { count: 0, total: 0 };
      }
      modeSummary[p.paymentMode].count++;
      modeSummary[p.paymentMode].total += p.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        modeSummary,
        groupedData: Object.values(groupedData)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch revenue report
// @route   GET /api/reports/batch-revenue
// @access  Private
exports.getBatchRevenueReport = async (req, res, next) => {
  try {
    const batches = await Batch.find();

    const batchRevenueData = await Promise.all(
      batches.map(async (batch) => {
        const enrollments = await Enrollment.find({ 
          batchId: batch._id,
          status: { $ne: 'Dropped' }
        }).populate('studentId', 'name');

        const enrollmentDetails = await Promise.all(
          enrollments.map(async (enrollment) => {
            const payments = await Payment.find({ enrollmentId: enrollment._id });
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            
            return {
              studentName: enrollment.studentId.name,
              finalFees: enrollment.finalFees,
              totalPaid,
              pendingAmount: enrollment.finalFees - totalPaid,
              status: enrollment.status
            };
          })
        );

        const totalExpected = enrollmentDetails.reduce((sum, e) => sum + e.finalFees, 0);
        const totalCollected = enrollmentDetails.reduce((sum, e) => sum + e.totalPaid, 0);

        return {
          batchId: batch._id,
          batchName: batch.batchName,
          courseName: batch.courseName,
          batchFees: batch.fees,
          status: batch.status,
          enrollmentCount: enrollments.length,
          totalExpectedRevenue: totalExpected,
          totalCollectedRevenue: totalCollected,
          pendingRevenue: totalExpected - totalCollected,
          collectionPercentage: totalExpected > 0 
            ? ((totalCollected / totalExpected) * 100).toFixed(2) 
            : 0,
          enrollments: enrollmentDetails
        };
      })
    );

    const overallSummary = {
      totalBatches: batches.length,
      totalEnrollments: batchRevenueData.reduce((sum, b) => sum + b.enrollmentCount, 0),
      totalExpectedRevenue: batchRevenueData.reduce((sum, b) => sum + b.totalExpectedRevenue, 0),
      totalCollectedRevenue: batchRevenueData.reduce((sum, b) => sum + b.totalCollectedRevenue, 0),
      totalPendingRevenue: batchRevenueData.reduce((sum, b) => sum + b.pendingRevenue, 0),
      overallCollectionPercentage: batchRevenueData.reduce((sum, b) => sum + b.totalExpectedRevenue, 0) > 0
        ? ((batchRevenueData.reduce((sum, b) => sum + b.totalCollectedRevenue, 0) / 
           batchRevenueData.reduce((sum, b) => sum + b.totalExpectedRevenue, 0)) * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        overallSummary,
        batchDetails: batchRevenueData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly collection report
// @route   GET /api/reports/monthly-collection
// @access  Private
exports.getMonthlyCollectionReport = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const payments = await Payment.find({
        paymentDate: {
          $gte: monthStart,
          $lte: monthEnd
        }
      }).populate('receivedBy', 'name');

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      // Group by payment mode
      const modeBreakdown = {};
      payments.forEach(p => {
        if (!modeBreakdown[p.paymentMode]) {
          modeBreakdown[p.paymentMode] = { count: 0, amount: 0 };
        }
        modeBreakdown[p.paymentMode].count++;
        modeBreakdown[p.paymentMode].amount += p.amount;
      });

      // Get new enrollments in this month
      const newEnrollments = await Enrollment.countDocuments({
        joiningDate: {
          $gte: monthStart,
          $lte: monthEnd
        }
      });

      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'long' }),
        year: parseInt(year),
        totalCollection: totalAmount,
        paymentCount: payments.length,
        averagePayment: payments.length > 0 ? totalAmount / payments.length : 0,
        modeBreakdown,
        newEnrollments
      });
    }

    const yearlyTotal = monthlyData.reduce((sum, m) => sum + m.totalCollection, 0);

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        yearlyTotal,
        monthlyAverage: yearlyTotal / 12,
        bestMonth: monthlyData.reduce((best, current) => 
          current.totalCollection > best.totalCollection ? current : best
        ),
        monthlyData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily collection report
// @route   GET /api/reports/daily-collection
// @access  Private
exports.getDailyCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.paymentDate = { $gte: thirtyDaysAgo };
    }

    const payments = await Payment.find(query)
      .populate('receivedBy', 'name')
      .sort({ paymentDate: 1 });

    // Group by date
    const dailyData = {};
    payments.forEach(payment => {
      const dateKey = payment.paymentDate.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          paymentCount: 0,
          modes: {}
        };
      }

      dailyData[dateKey].totalAmount += payment.amount;
      dailyData[dateKey].paymentCount++;
      
      if (!dailyData[dateKey].modes[payment.paymentMode]) {
        dailyData[dateKey].modes[payment.paymentMode] = {
          count: 0,
          amount: 0
        };
      }
      dailyData[dateKey].modes[payment.paymentMode].count++;
      dailyData[dateKey].modes[payment.paymentMode].amount += payment.amount;
    });

    const dailyArray = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const summary = {
      totalDays: dailyArray.length,
      totalCollection: dailyArray.reduce((sum, d) => sum + d.totalAmount, 0),
      totalPayments: dailyArray.reduce((sum, d) => sum + d.paymentCount, 0),
      averageDailyCollection: dailyArray.length > 0 
        ? dailyArray.reduce((sum, d) => sum + d.totalAmount, 0) / dailyArray.length 
        : 0,
      highestCollectionDay: dailyArray.length > 0 
        ? dailyArray.reduce((best, current) => 
            current.totalAmount > best.totalAmount ? current : best
          )
        : null
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        dailyData: dailyArray
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student-wise collection report
// @route   GET /api/reports/student-wise-collection
// @access  Private
exports.getStudentWiseCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate, sort = 'totalPaid' } = req.query;

    const query = { status: { $ne: 'Dropped' } };

    if (startDate || endDate) {
      query.joiningDate = {};
      if (startDate) query.joiningDate.$gte = new Date(startDate);
      if (endDate) query.joiningDate.$lte = new Date(endDate);
    }

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'name mobile studentId')
      .populate('batchId', 'batchName courseName');

    const studentCollections = {};

    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId._id.toString();
      
      if (!studentCollections[studentId]) {
        studentCollections[studentId] = {
          student: enrollment.studentId,
          enrollments: [],
          totalFees: 0,
          totalPaid: 0,
          totalPending: 0,
          enrollmentCount: 0
        };
      }

      const payments = await Payment.find({ enrollmentId: enrollment._id });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = enrollment.finalFees - totalPaid;

      studentCollections[studentId].enrollments.push({
        batch: enrollment.batchId,
        finalFees: enrollment.finalFees,
        totalPaid,
        pendingAmount,
        status: enrollment.status
      });

      studentCollections[studentId].totalFees += enrollment.finalFees;
      studentCollections[studentId].totalPaid += totalPaid;
      studentCollections[studentId].totalPending += pendingAmount;
      studentCollections[studentId].enrollmentCount++;
    }

    const studentArray = Object.values(studentCollections);

    // Sort
    studentArray.sort((a, b) => {
      switch(sort) {
        case 'name':
          return a.student.name.localeCompare(b.student.name);
        case 'totalFees':
          return b.totalFees - a.totalFees;
        case 'totalPending':
          return b.totalPending - a.totalPending;
        default:
          return b.totalPaid - a.totalPaid;
      }
    });

    const summary = {
      totalStudents: studentArray.length,
      totalCollection: studentArray.reduce((sum, s) => sum + s.totalPaid, 0),
      totalPending: studentArray.reduce((sum, s) => sum + s.totalPending, 0),
      averagePerStudent: studentArray.length > 0
        ? studentArray.reduce((sum, s) => sum + s.totalPaid, 0) / studentArray.length
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        students: studentArray
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch-wise collection report
// @route   GET /api/reports/batch-wise-collection
// @access  Private
exports.getBatchWiseCollectionReport = async (req, res, next) => {
  try {
    const { status } = req.query;

    const batchQuery = {};
    if (status) batchQuery.status = status;

    const batches = await Batch.find(batchQuery);

    const batchCollections = await Promise.all(
      batches.map(async (batch) => {
        const enrollments = await Enrollment.find({ 
          batchId: batch._id,
          status: { $ne: 'Dropped' }
        });

        let totalExpected = 0;
        let totalCollected = 0;

        for (const enrollment of enrollments) {
          totalExpected += enrollment.finalFees;
          const payments = await Payment.find({ enrollmentId: enrollment._id });
          totalCollected += payments.reduce((sum, p) => sum + p.amount, 0);
        }

        return {
          batch: {
            id: batch._id,
            name: batch.batchName,
            course: batch.courseName,
            fees: batch.fees,
            status: batch.status,
            startDate: batch.startDate,
            endDate: batch.endDate
          },
          statistics: {
            enrolledStudents: enrollments.length,
            totalExpected,
            totalCollected,
            pending: totalExpected - totalCollected,
            collectionRate: totalExpected > 0 
              ? ((totalCollected / totalExpected) * 100).toFixed(2) 
              : 0,
            averageCollectionPerStudent: enrollments.length > 0 
              ? totalCollected / enrollments.length 
              : 0
          }
        };
      })
    );

    // Sort by collection rate
    batchCollections.sort((a, b) => 
      parseFloat(b.statistics.collectionRate) - parseFloat(a.statistics.collectionRate)
    );

    const summary = {
      totalBatches: batchCollections.length,
      totalExpectedRevenue: batchCollections.reduce((sum, b) => sum + b.statistics.totalExpected, 0),
      totalCollectedRevenue: batchCollections.reduce((sum, b) => sum + b.statistics.totalCollected, 0),
      totalPending: batchCollections.reduce((sum, b) => sum + b.statistics.pending, 0),
      overallCollectionRate: batchCollections.reduce((sum, b) => sum + b.statistics.totalExpected, 0) > 0
        ? ((batchCollections.reduce((sum, b) => sum + b.statistics.totalCollected, 0) / 
           batchCollections.reduce((sum, b) => sum + b.statistics.totalExpected, 0)) * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        batches: batchCollections
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export report data
// @route   GET /api/reports/export/:type
// @access  Private
exports.exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query; // json, csv, excel
    const filters = req.query;

    let data;
    let filename;

    switch(type) {
      case 'pending-fees':
        const pendingResult = await exports.getPendingFeesReport(req, res, next);
        data = pendingResult;
        filename = `pending-fees-report-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'payment-history':
        const paymentResult = await exports.getPaymentHistoryReport(req, res, next);
        data = paymentResult;
        filename = `payment-history-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'student-ledger':
        const ledgerResult = await exports.getStudentLedgerReport(req, res, next);
        data = ledgerResult;
        filename = `student-ledger-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'batch-revenue':
        const revenueResult = await exports.getBatchRevenueReport(req, res, next);
        data = revenueResult;
        filename = `batch-revenue-${new Date().toISOString().split('T')[0]}`;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // For now, return JSON format
    // In production, implement CSV/Excel conversion using libraries like 'csv-writer' or 'exceljs'
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
      
      return res.status(200).json({
        success: true,
        type,
        generatedAt: new Date().toISOString(),
        data
      });
    }

    // Placeholder for other formats
    res.status(200).json({
      success: true,
      message: `Report exported successfully in ${format} format`,
      filename: `${filename}.${format}`,
      data
    });
  } catch (error) {
    next(error);
  }
};