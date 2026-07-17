const path = require('path');
const fs = require('fs');
const Staff = require('../models/Staff');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// @desc    Create new staff
// @route   POST /api/staff
// @access  Private
exports.createStaff = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files && req.files.photo) {
        try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, mobile, alternateMobile, address, designation, course, salary, joiningDate, status, gender, dateOfBirth, aadharNumber, notes } = req.body;

    const existingStaff = await Staff.findOne({ mobile });
    if (existingStaff) {
      if (req.files && req.files.photo) {
        try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, message: 'Staff already exists with this mobile number' });
    }

    // Handle photo upload
    let photoPath = null;
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      const imageName = `${Date.now()}_${name.replace(/\s+/g, '-')}${path.extname(photo.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/staff');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      await photo.mv(uploadPath);
      photoPath = `/uploads/staff/${imageName}`;
    }

    const staffData = {
      name, mobile,
      email: email || null,
      alternateMobile: alternateMobile || null,
      address: address || null,
      designation,
      course: course || null,
      salary: salary || null,
      joiningDate: joiningDate || Date.now(),
      status: status || 'Active',
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      aadharNumber: aadharNumber || null,
      notes: notes || null,
      photo: photoPath,
      createdBy: req.user.id
    };

    const staff = await Staff.create(staffData);
    await staff.populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Staff created successfully', data: staff });
  } catch (error) {
    if (req.files && req.files.photo) {
      try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
    }
    next(error);
  }
};

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
exports.getStaff = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, designation, status, search, joiningDateStart, joiningDateEnd, sort = '-createdAt' } = req.query;
    const query = {};

    if (designation) query.designation = designation;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    if (joiningDateStart || joiningDateEnd) {
      query.joiningDate = {};
      if (joiningDateStart) query.joiningDate.$gte = new Date(joiningDateStart);
      if (joiningDateEnd) query.joiningDate.$lte = new Date(joiningDateEnd);
    }

    const staff = await Staff.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Staff.countDocuments(query);

    res.status(200).json({
      success: true, count: staff.length, total,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      data: staff
    });
  } catch (error) { next(error); }
};

// @desc    Get single staff
// @route   GET /api/staff/:id
// @access  Private
exports.getSingleStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Get recent salary payments
    const salaryExpenses = await Expense.find({ staffId: req.params.id, category: 'Salary' })
      .sort('-expenseDate')
      .limit(5);

    res.status(200).json({ success: true, data: { staff, recentSalaries: salaryExpenses } });
  } catch (error) { next(error); }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private
exports.updateStaff = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files && req.files.photo) {
        try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      if (req.files && req.files.photo) {
        try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
      }
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const { name, email, mobile, alternateMobile, address, designation, course, salary, joiningDate, status, gender, dateOfBirth, aadharNumber, notes } = req.body;

    if (mobile && mobile !== staff.mobile) {
      const dup = await Staff.findOne({ mobile, _id: { $ne: req.params.id } });
      if (dup) {
        if (req.files && req.files.photo) {
          try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
        }
        return res.status(400).json({ success: false, message: 'Another staff exists with this mobile' });
      }
    }

    const updateFields = { updatedBy: req.user.id };
    if (name) updateFields.name = name;
    if (mobile) updateFields.mobile = mobile;
    if (email !== undefined) updateFields.email = email || null;
    if (alternateMobile !== undefined) updateFields.alternateMobile = alternateMobile || null;
    if (address !== undefined) updateFields.address = address || null;
    if (designation) updateFields.designation = designation;
    if (course !== undefined) updateFields.course = course || null;
    if (salary !== undefined) updateFields.salary = salary || null;
    if (joiningDate) updateFields.joiningDate = joiningDate;
    if (status) updateFields.status = status;
    if (gender !== undefined) updateFields.gender = gender || null;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth || null;
    if (aadharNumber !== undefined) updateFields.aadharNumber = aadharNumber || null;
    if (notes !== undefined) updateFields.notes = notes || null;

    // Handle photo upload
    if (req.files && req.files.photo) {
      // Delete old photo if exists
      if (staff.photo) {
        const oldPath = path.join(__dirname, '..', 'public', staff.photo);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (err) {}
        }
      }
      
      const photo = req.files.photo;
      const staffName = name || staff.name;
      const imageName = `${Date.now()}_${staffName.replace(/\s+/g, '-')}${path.extname(photo.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/staff');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      await photo.mv(uploadPath);
      updateFields.photo = `/uploads/staff/${imageName}`;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, message: 'Staff updated', data: updatedStaff });
  } catch (error) {
    if (req.files && req.files.photo) {
      try { fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path); } catch (err) {}
    }
    next(error);
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private/Super Admin
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Delete photo if exists
    if (staff.photo) {
      const photoPath = path.join(__dirname, '..', 'public', staff.photo);
      if (fs.existsSync(photoPath)) {
        try { fs.unlinkSync(photoPath); } catch (err) {}
      }
    }

    await Staff.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Staff deleted' });
  } catch (error) { next(error); }
};

// @desc    Update staff status
// @route   PATCH /api/staff/:id/status
// @access  Private
exports.updateStaffStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, { status, updatedBy: req.user.id }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    res.status(200).json({ success: true, message: `Status updated to ${status}`, data: staff });
  } catch (error) { next(error); }
};

// @desc    Delete staff photo only
// @route   DELETE /api/staff/:id/photo
// @access  Private
exports.deleteStaffPhoto = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    if (staff.photo) {
      const photoPath = path.join(__dirname, '..', 'public', staff.photo);
      if (fs.existsSync(photoPath)) {
        try { fs.unlinkSync(photoPath); } catch (err) {}
      }
      staff.photo = null;
      staff.updatedBy = req.user.id;
      await staff.save();
    }

    res.status(200).json({ success: true, message: 'Photo deleted', data: staff });
  } catch (error) { next(error); }
};

// @desc    Get staff statistics
// @route   GET /api/staff/stats/summary
// @access  Private
exports.getStaffStats = async (req, res, next) => {
  try {
    const [total, active, inactive, onLeave, designationBreakdown] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'Active' }),
      Staff.countDocuments({ status: 'Inactive' }),
      Staff.countDocuments({ status: 'On Leave' }),
      Staff.aggregate([{ $group: { _id: '$designation', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);

    res.status(200).json({
      success: true,
      data: { total, active, inactive, onLeave, designationBreakdown }
    });
  } catch (error) { next(error); }
};