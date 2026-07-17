const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Please provide batch name'],
    trim: true,
    maxlength: [100, 'Batch name cannot exceed 100 characters'],
    unique: true
  },
  courseName: {
    type: String,
    required: [true, 'Please provide course name'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  fees: {
    type: Number,
    required: [true, 'Please provide batch fees'],
    min: [0, 'Fees cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Please provide batch duration'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date'],
  },
  timing: {
    type: String,
    required: [true, 'Please provide batch timing'],
    trim: true
  },
  faculty: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['Running', 'Completed', 'Upcoming', 'Cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Upcoming'
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
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: null
  },
  maxStudents: {
    type: Number,
    default: null
  },
  roomNumber: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for enrollments
batchSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'batchId'
});

// Virtual for active enrollments
batchSchema.virtual('activeEnrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'batchId',
  match: { status: 'Running' }
});

// Method to get enrolled students count
batchSchema.methods.getEnrolledStudentsCount = async function() {
  const Enrollment = mongoose.model('Enrollment');
  return await Enrollment.countDocuments({ 
    batchId: this._id,
    status: { $ne: 'Dropped' }
  });
};

// Method to get total revenue from this batch
batchSchema.methods.getTotalRevenue = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const enrollments = await Enrollment.find({ 
    batchId: this._id,
    status: { $ne: 'Dropped' }
  });
  
  let totalRevenue = 0;
  for (const enrollment of enrollments) {
    const Payment = mongoose.model('Payment');
    const payments = await Payment.find({ enrollmentId: enrollment._id });
    totalRevenue += payments.reduce((sum, payment) => sum + payment.amount, 0);
  }
  
  return totalRevenue;
};

// Pre-save middleware to auto-update status based on dates
batchSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'Cancelled') {
    return next();
  }
  
  if (this.endDate < now) {
    this.status = 'Completed';
  } else if (this.startDate <= now && this.endDate >= now) {
    this.status = 'Running';
  } else if (this.startDate > now) {
    this.status = 'Upcoming';
  }
  
  next();
});

// Indexes
// batchSchema.index({ batchName: 1 });
// batchSchema.index({ status: 1 });
// batchSchema.index({ startDate: 1 });
// batchSchema.index({ createdBy: 1 });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;