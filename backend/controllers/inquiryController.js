const Inquiry = require('../models/Inquiry');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Private
exports.createInquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      name, contactNumber, parentContact, qualification, 
      courseName, comments, inquiryDate, status, address, followUpDate, followUpNotes 
    } = req.body;

    // Check if inquiry with same contact already exists as pending
    const existingInquiry = await Inquiry.findOne({ 
      contactNumber, 
      status: 'Inquired' 
    });
    
    if (existingInquiry) {
      return res.status(400).json({
        success: false,
        message: 'An active inquiry already exists with this contact number'
      });
    }

    const inquiryData = {
      name,
      contactNumber,
      parentContact: parentContact || null,
      qualification: qualification || null,
      courseName: courseName || null,
      comments: comments || null,
      inquiryDate: inquiryDate || Date.now(),
      status: status || 'Inquired',
      address: address || null,
      followUpDate: followUpDate || null,
      followUpNotes: followUpNotes || null,
      createdBy: req.user.id
    };

    const inquiry = await Inquiry.create(inquiryData);
    await inquiry.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private
exports.getInquiries = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      courseName,
      search,
      sort = '-inquiryDate',
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (courseName) query.courseName = { $regex: courseName, $options: 'i' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { inquiryId: { $regex: search, $options: 'i' } },
        { comments: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.inquiryDate = {};
      if (startDate) query.inquiryDate.$gte = new Date(startDate);
      if (endDate) query.inquiryDate.$lte = new Date(endDate);
    }

    const inquiries = await Inquiry.find(query)
      .populate('createdBy', 'name email')
      .populate('convertedToStudent', 'name studentId')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Inquiry.countDocuments(query);

    res.status(200).json({
      success: true,
      count: inquiries.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inquiry
// @route   GET /api/inquiries/:id
// @access  Private
exports.getInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('convertedToStudent', 'name studentId mobile');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry
// @route   PUT /api/inquiries/:id
// @access  Private
exports.updateInquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const { 
      name, contactNumber, parentContact, qualification, 
      courseName, comments, inquiryDate, status, address, 
      followUpDate, followUpNotes, convertedToStudent 
    } = req.body;

    // Check duplicate contact for other inquiries
    if (contactNumber && contactNumber !== inquiry.contactNumber) {
      const existingInquiry = await Inquiry.findOne({ 
        contactNumber, 
        status: 'Inquired',
        _id: { $ne: req.params.id } 
      });
      if (existingInquiry) {
        return res.status(400).json({
          success: false,
          message: 'Another active inquiry exists with this contact number'
        });
      }
    }

    const updateFields = { updatedBy: req.user.id };
    if (name) updateFields.name = name;
    if (contactNumber) updateFields.contactNumber = contactNumber;
    if (parentContact !== undefined) updateFields.parentContact = parentContact || null;
    if (qualification !== undefined) updateFields.qualification = qualification || null;
    if (courseName !== undefined) updateFields.courseName = courseName || null;
    if (comments !== undefined) updateFields.comments = comments || null;
    if (inquiryDate) updateFields.inquiryDate = inquiryDate;
    if (status) updateFields.status = status;
    if (address !== undefined) updateFields.address = address || null;
    if (followUpDate !== undefined) updateFields.followUpDate = followUpDate || null;
    if (followUpNotes !== undefined) updateFields.followUpNotes = followUpNotes || null;
    if (convertedToStudent !== undefined) updateFields.convertedToStudent = convertedToStudent || null;

    // Auto-set joining date when status changes to Joined
    if (status === 'Joined' && inquiry.status !== 'Joined' && !inquiry.joiningDate) {
      updateFields.joiningDate = new Date();
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('convertedToStudent', 'name studentId');

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: updatedInquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private/Super Admin
exports.deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    await Inquiry.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status
// @route   PATCH /api/inquiries/:id/status
// @access  Private
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, convertedToStudent } = req.body;

    const validStatuses = ['Inquired', 'Joined', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const updateFields = { status, updatedBy: req.user.id };

    if (status === 'Joined') {
      updateFields.joiningDate = new Date();
      if (convertedToStudent) {
        // Verify student exists
        const student = await Student.findById(convertedToStudent);
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student not found' });
        }
        updateFields.convertedToStudent = convertedToStudent;
      }
    }

    if (status === 'Cancelled') {
      updateFields.convertedToStudent = null;
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('convertedToStudent', 'name studentId');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.status(200).json({
      success: true,
      message: `Inquiry status updated to "${status}"`,
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert inquiry to student
// @route   POST /api/inquiries/:id/convert
// @access  Private
exports.convertToStudent = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (inquiry.status === 'Joined') {
      return res.status(400).json({ success: false, message: 'Inquiry is already converted to student' });
    }

    // Create student from inquiry data
    const studentData = {
      name: inquiry.name,
      mobile: inquiry.contactNumber,
      parentMobile: inquiry.parentContact,
      address: inquiry.address,
      joiningDate: new Date(),
      status: 'Active',
      notes: `Converted from inquiry ${inquiry.inquiryId}. ${inquiry.comments || ''}`,
      createdBy: req.user.id
    };

    const student = await Student.create(studentData);

    // Update inquiry
    inquiry.status = 'Joined';
    inquiry.joiningDate = new Date();
    inquiry.convertedToStudent = student._id;
    inquiry.updatedBy = req.user.id;
    await inquiry.save();

    await inquiry.populate('convertedToStudent', 'name studentId');

    res.status(200).json({
      success: true,
      message: 'Inquiry converted to student successfully',
      data: {
        inquiry,
        student
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inquiry statistics
// @route   GET /api/inquiries/stats/summary
// @access  Private
exports.getInquiryStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalInquiries,
      todayInquiries,
      monthlyInquiries,
      inquiredCount,
      joinedCount,
      cancelledCount,
      courseBreakdown
    ] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ inquiryDate: { $gte: today, $lt: tomorrow } }),
      Inquiry.countDocuments({ inquiryDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } }),
      Inquiry.countDocuments({ status: 'Inquired' }),
      Inquiry.countDocuments({ status: 'Joined' }),
      Inquiry.countDocuments({ status: 'Cancelled' }),
      Inquiry.aggregate([
        { $group: { _id: '$courseName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const conversionRate = totalInquiries > 0 
      ? ((joinedCount / totalInquiries) * 100).toFixed(2) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalInquiries,
        today: todayInquiries,
        monthly: monthlyInquiries,
        statusBreakdown: {
          inquired: inquiredCount,
          joined: joinedCount,
          cancelled: cancelledCount
        },
        conversionRate: `${conversionRate}%`,
        courseBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};