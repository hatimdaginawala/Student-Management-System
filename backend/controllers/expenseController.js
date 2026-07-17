const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files && req.files.receiptImage) {
        try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { expenseDate, category, amount, description, paymentMode, staffId, paidTo, receiptNumber, remarks } = req.body;

    // Validate salary requires staff
    if (category === 'Salary' && !staffId) {
      if (req.files && req.files.receiptImage) {
        try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, message: 'Staff ID is required for Salary expenses' });
    }

    // If staffId provided, verify staff exists
    if (staffId) {
      const staff = await Staff.findById(staffId);
      if (!staff) {
        if (req.files && req.files.receiptImage) {
          try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
        }
        return res.status(404).json({ success: false, message: 'Staff not found' });
      }
    }

    // Handle receipt image upload
    let receiptImagePath = null;
    if (req.files && req.files.receiptImage) {
      const receipt = req.files.receiptImage;
      const imageName = `${Date.now()}_expense${path.extname(receipt.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/expenses');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      await receipt.mv(uploadPath);
      receiptImagePath = `/uploads/expenses/${imageName}`;
    }

    const expenseData = {
      expenseDate: expenseDate || Date.now(),
      category,
      amount,
      description: description || null,
      paymentMode,
      staffId: staffId || null,
      paidTo: paidTo || null,
      receiptNumber: receiptNumber || null,
      remarks: remarks || null,
      receiptImage: receiptImagePath,
      createdBy: req.user.id
    };

    const expense = await Expense.create(expenseData);
    await expense.populate([
      { path: 'staffId', select: 'name staffId designation course' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
  } catch (error) {
    if (req.files && req.files.receiptImage) {
      try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
    }
    next(error);
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, category, paymentMode, staffId, minAmount, maxAmount, search, sort = '-expenseDate' } = req.query;
    const query = {};

    if (category) query.category = category;
    if (paymentMode) query.paymentMode = paymentMode;
    if (staffId) query.staffId = staffId;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { paidTo: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const expenses = await Expense.find(query)
      .populate('staffId', 'name staffId designation course')
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      data: expenses
    });
  } catch (error) { next(error); }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('staffId', 'name staffId designation course mobile salary')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.status(200).json({ success: true, data: expense });
  } catch (error) { next(error); }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files && req.files.receiptImage) {
        try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      if (req.files && req.files.receiptImage) {
        try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
      }
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { expenseDate, category, amount, description, paymentMode, staffId, paidTo, receiptNumber, remarks } = req.body;

    const finalCategory = category || expense.category;
    const finalStaffId = staffId !== undefined ? staffId : expense.staffId;
    
    if (finalCategory === 'Salary' && !finalStaffId) {
      if (req.files && req.files.receiptImage) {
        try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
      }
      return res.status(400).json({ success: false, message: 'Staff ID is required for Salary expenses' });
    }

    if (staffId) {
      const staff = await Staff.findById(staffId);
      if (!staff) {
        if (req.files && req.files.receiptImage) {
          try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
        }
        return res.status(404).json({ success: false, message: 'Staff not found' });
      }
    }

    const updateFields = { updatedBy: req.user.id };
    if (expenseDate) updateFields.expenseDate = expenseDate;
    if (category) updateFields.category = category;
    if (amount) updateFields.amount = amount;
    if (description) updateFields.description = description;
    if (paymentMode) updateFields.paymentMode = paymentMode;
    if (staffId !== undefined) updateFields.staffId = staffId || null;
    if (paidTo !== undefined) updateFields.paidTo = paidTo || null;
    if (receiptNumber !== undefined) updateFields.receiptNumber = receiptNumber || null;
    if (remarks !== undefined) updateFields.remarks = remarks || null;

    // Handle receipt image upload
    if (req.files && req.files.receiptImage) {
      // Delete old receipt image if exists
      if (expense.receiptImage) {
        const oldPath = path.join(__dirname, '..', 'public', expense.receiptImage);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (err) {}
        }
      }
      
      const receipt = req.files.receiptImage;
      const imageName = `${Date.now()}_expense${path.extname(receipt.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/expenses');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      await receipt.mv(uploadPath);
      updateFields.receiptImage = `/uploads/expenses/${imageName}`;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('staffId', 'name staffId designation course')
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, message: 'Expense updated successfully', data: updatedExpense });
  } catch (error) {
    if (req.files && req.files.receiptImage) {
      try { fs.unlinkSync(req.files.receiptImage.tempFilePath || req.files.receiptImage.path); } catch (err) {}
    }
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Super Admin
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    // Delete receipt image if exists
    if (expense.receiptImage) {
      const imgPath = path.join(__dirname, '..', 'public', expense.receiptImage);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (err) {}
      }
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) { next(error); }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/summary
// @access  Private
exports.getExpenseStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayExpenses, monthlyExpenses, totalExpenses, categoryBreakdown, salaryExpenses] = await Promise.all([
      Expense.find({ expenseDate: { $gte: today, $lt: tomorrow } }),
      Expense.find({ expenseDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } }),
      Expense.find(),
      Expense.aggregate([
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Expense.find({ category: 'Salary', expenseDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } })
    ]);

    const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
    const totalAllTime = totalExpenses.reduce((s, e) => s + e.amount, 0);
    const salaryTotal = salaryExpenses.reduce((s, e) => s + e.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        today: { count: todayExpenses.length, total: todayTotal },
        monthly: { count: monthlyExpenses.length, total: monthlyTotal },
        allTime: { count: totalExpenses.length, total: totalAllTime },
        salary: { count: salaryExpenses.length, total: salaryTotal },
        categoryBreakdown
      }
    });
  } catch (error) { next(error); }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
exports.getExpensesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { category };
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('staffId', 'name staffId designation')
      .populate('createdBy', 'name')
      .sort('-expenseDate')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true, count: expenses.length, total,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      data: expenses
    });
  } catch (error) { next(error); }
};

// @desc    Get expenses by staff
// @route   GET /api/expenses/staff/:staffId
// @access  Private
exports.getExpensesByStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const query = { staffId };
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .sort('-expenseDate')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true, count: expenses.length, total,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      staff: { _id: staff._id, name: staff.name, staffId: staff.staffId, designation: staff.designation, salary: staff.salary },
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      data: expenses
    });
  } catch (error) { next(error); }
};