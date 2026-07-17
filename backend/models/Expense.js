const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseDate: {
    type: Date,
    required: [true, 'Please provide expense date'],
    default: Date.now
  },
  category: {
    type: String,
    required: [true, 'Please provide expense category'],
    enum: {
      values: [
        'Rent',
        'Electricity',
        'Internet',
        'Salary',
        'Stationery',
        'Maintenance',
        'Marketing',
        'Travel',
        'Food & Refreshments',
        'Other'
      ],
      message: '{VALUE} is not a valid expense category'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [false, 'Please provide expense description'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  paymentMode: {
    type: String,
    required: [true, 'Please provide payment mode'],
    enum: {
      values: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'],
      message: '{VALUE} is not a valid payment mode'
    }
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  },
  paidTo: {
    type: String,
    trim: true,
    maxlength: [200, 'Paid to cannot exceed 200 characters'],
    default: null
  },
  receiptNumber: {
    type: String,
    trim: true,
    default: null
  },
  receiptImage: {
    type: String,
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation: staffId is required when category is Salary
expenseSchema.pre('save', function(next) {
  if (this.category === 'Salary' && !this.staffId) {
    return next(new Error('Staff ID is required when category is Salary'));
  }
  next();
});

// Indexes
// expenseSchema.index({ expenseDate: -1 });
// expenseSchema.index({ category: 1 });
// expenseSchema.index({ staffId: 1 });
// expenseSchema.index({ createdBy: 1 });
// expenseSchema.index({ paymentMode: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;