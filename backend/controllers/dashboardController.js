const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month range
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Parallel queries for performance
    const [
      totalStudents,
      activeStudents,
      totalBatches,
      runningBatches,
      completedBatches,
      todayPayments,
      monthlyPayments,
      recentAdmissions,
      recentPayments
    ] = await Promise.all([
      // Student counts
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      
      // Batch counts
      Batch.countDocuments(),
      Batch.countDocuments({ status: 'Running' }),
      Batch.countDocuments({ status: 'Completed' }),
      
      // Today's payments
      Payment.find({
        paymentDate: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      
      // Monthly payments
      Payment.find({
        paymentDate: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      }),
      
      // Recent admissions (last 10)
      Student.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name'),
      
      // Recent payments (last 10)
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'enrollmentId',
          populate: [
            {
              path: 'studentId',
              select: 'name studentId'
            },
            {
              path: 'batchId',
              select: 'batchName'
            }
          ]
        })
        .populate('receivedBy', 'name')
    ]);

    // Calculate today's collection
    const todayCollection = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate monthly collection
    const monthlyCollection = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate total revenue
    const allPayments = await Payment.find();
    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate pending fees
    const allEnrollments = await Enrollment.find({ status: { $ne: 'Dropped' } });
    let totalPendingFees = 0;
    
    for (const enrollment of allEnrollments) {
      const payments = await Payment.find({ enrollmentId: enrollment._id });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      totalPendingFees += Math.max(0, enrollment.finalFees - totalPaid);
    }

    // Payment mode distribution for today
    const todayPaymentModeDistribution = todayPayments.reduce((acc, payment) => {
      acc[payment.paymentMode] = (acc[payment.paymentMode] || 0) + payment.amount;
      return acc;
    }, {});

    // Enrollment statistics
    const totalEnrollments = await Enrollment.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({ status: 'Running' });
    const completedEnrollments = await Enrollment.countDocuments({ status: 'Completed' });
    const droppedEnrollments = await Enrollment.countDocuments({ status: 'Dropped' });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents: totalStudents - activeStudents,
          totalBatches,
          runningBatches,
          completedBatches,
          upcomingBatches: totalBatches - runningBatches - completedBatches,
          todayCollection,
          monthlyCollection,
          totalRevenue,
          pendingFees: totalPendingFees,
          collectionRate: totalRevenue > 0 
            ? ((totalRevenue / (totalRevenue + totalPendingFees)) * 100).toFixed(2)
            : 0
        },
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments,
          completed: completedEnrollments,
          dropped: droppedEnrollments
        },
        todayPaymentModes: todayPaymentModeDistribution,
        recentAdmissions,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};