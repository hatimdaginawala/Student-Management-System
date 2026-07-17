const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  batchFees: {
    type: Number,
    required: [true, 'Batch fees is required'],
    min: [0, 'Batch fees cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.batchFees;
      },
      message: 'Discount cannot exceed batch fees'
    }
  },
  finalFees: {
    type: Number,
    required: [true, 'Final fees is required'],
    min: [0, 'Final fees cannot be negative']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Running', 'Completed', 'Dropped'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Running'
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
  },
  completionDate: {
    type: Date,
    default: null
  },
  dropDate: {
    type: Date,
    default: null
  },
  dropReason: {
    type: String,
    maxlength: [500, 'Drop reason cannot exceed 500 characters'],
    default: null
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for payments
enrollmentSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'enrollmentId'
});

// Calculate pending amount
enrollmentSchema.methods.calculatePendingAmount = async function() {
  const Payment = mongoose.model('Payment');
  const payments = await Payment.find({ enrollmentId: this._id });
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return this.finalFees - totalPaid;
};

// Calculate total paid amount
enrollmentSchema.methods.calculateTotalPaid = async function() {
  const Payment = mongoose.model('Payment');
  const payments = await Payment.find({ enrollmentId: this._id });
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
};

// Get payment history
enrollmentSchema.methods.getPaymentHistory = async function() {
  const Payment = mongoose.model('Payment');
  return await Payment.find({ enrollmentId: this._id })
    .sort({ paymentDate: -1 })
    .populate('receivedBy', 'name');
};

// Pre-save middleware to auto-calculate final fees
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('batchFees') || this.isModified('discount')) {
    this.finalFees = this.batchFees - this.discount;
  }
  
  // Auto-update status based on completion/drop
  if (this.isModified('status')) {
    if (this.status === 'Completed' && !this.completionDate) {
      this.completionDate = new Date();
    }
    if (this.status === 'Dropped' && !this.dropDate) {
      this.dropDate = new Date();
    }
  }
  
  next();
});

// Prevent duplicate enrollment
enrollmentSchema.index(
  { studentId: 1, batchId: 1 }, 
  { unique: true }
);

// Additional indexes
// enrollmentSchema.index({ status: 1 });
// enrollmentSchema.index({ joiningDate: 1 });
// enrollmentSchema.index({ createdBy: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;