const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create new user (Admin)
// @route   POST /api/users
// @access  Private/Super Admin
exports.createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, mobile, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Only Super Admin can create other Super Admins
    if (role === 'Super Admin' && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create Super Admin users'
      });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: role || 'Admin',
      createdBy: req.user.id
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Super Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by name, email, or mobile
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Don't return password
    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Super Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Super Admin
exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, mobile, role } = req.body;

    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (mobile) updateFields.mobile = mobile;
    
    // Only Super Admin can update roles
    if (role && req.user.role === 'Super Admin') {
      updateFields.role = role;
    }

    updateFields.updatedBy = req.user.id;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (Activate/Deactivate)
// @route   PATCH /api/users/status/:id
// @access  Private/Super Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Prevent deactivating yourself
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${status.toLowerCase()} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Super Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only Super Admin can delete Super Admin
    if (user.role === 'Super Admin' && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete Super Admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password (Admin)
// @route   POST /api/users/reset-password
// @access  Private/Super Admin
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    user.updatedBy = req.user.id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, mobile } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (mobile) updateFields.mobile = mobile;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};