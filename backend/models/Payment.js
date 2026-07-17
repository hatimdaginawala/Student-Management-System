const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Enrollment is required']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide payment amount'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentMode: {
    type: String,
    enum: {
      values: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'],
      message: '{VALUE} is not a valid payment mode'
    },
    required: [true, 'Please provide payment mode']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    unique: true,
    trim: true
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    default: null
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Received by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Additional fields for specific payment modes
  transactionId: {
    type: String,
    trim: true,
    default: null
  },
  chequeNumber: {
    type: String,
    trim: true,
    default: null
  },
  chequeDate: {
    type: Date,
    default: null
  },
  bankName: {
    type: String,
    trim: true,
    default: null
  },
  // For tracking payment edits
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    previousAmount: Number,
    newAmount: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate receipt number before saving
paymentSchema.pre('save', async function(next) {
  if (this.receiptNumber) return next();
  
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last payment to generate sequence
    const lastPayment = await this.constructor.findOne({
      receiptNumber: new RegExp(`^RCP${year}${month}${day}`)
    }).sort({ receiptNumber: -1 });
    
    let sequence = '001';
    if (lastPayment && lastPayment.receiptNumber) {
      const lastSeq = parseInt(lastPayment.receiptNumber.slice(-3));
      sequence = (lastSeq + 1).toString().padStart(3, '0');
    }
    
    this.receiptNumber = `RCP${year}${month}${day}${sequence}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for enrollment details
paymentSchema.virtual('enrollmentDetails', {
  ref: 'Enrollment',
  localField: 'enrollmentId',
  foreignField: '_id',
  justOne: true
});

// Validate payment doesn't exceed pending amount
paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findById(this.enrollmentId);
    
    if (!enrollment) {
      return next(new Error('Enrollment not found'));
    }
    
    const pendingAmount = await enrollment.calculatePendingAmount();
    
    // Add back the current payment amount if it's an update
    let additionalAmount = 0;
    if (!this.isNew && this.isModified('amount')) {
      const oldPayment = await this.constructor.findById(this._id);
      additionalAmount = oldPayment ? oldPayment.amount : 0;
    }
    
    if (this.amount > (pendingAmount + additionalAmount)) {
      return next(new Error(`Payment amount (${this.amount}) exceeds pending amount (${pendingAmount})`));
    }
  }
  next();
});

// Post-save hook to check if enrollment is completed
paymentSchema.post('save', async function() {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findById(this.enrollmentId);
  
  if (enrollment && enrollment.status === 'Running') {
    const pendingAmount = await enrollment.calculatePendingAmount();
    
    if (pendingAmount <= 0) {
      enrollment.status = 'Completed';
      enrollment.completionDate = new Date();
      await enrollment.save();
    }
  }
});

// Indexes
// paymentSchema.index({ receiptNumber: 1 });
// paymentSchema.index({ enrollmentId: 1 });
// paymentSchema.index({ paymentDate: 1 });
// paymentSchema.index({ paymentMode: 1 });
// paymentSchema.index({ receivedBy: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;