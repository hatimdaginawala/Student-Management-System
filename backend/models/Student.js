const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide student name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  parentMobile: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    default: null
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    default: null
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters'],
    default: null
  },
  
  // NEW FIELDS
  fatherName: {
    type: String,
    trim: true,
    maxlength: [100, "Father's name cannot exceed 100 characters"],
    default: null
  },
  motherName: {
    type: String,
    trim: true,
    maxlength: [100, "Mother's name cannot exceed 100 characters"],
    default: null
  },
  fatherOccupation: {
    type: String,
    trim: true,
    maxlength: [100, "Father's occupation cannot exceed 100 characters"],
    default: null
  },
  motherOccupation: {
    type: String,
    trim: true,
    maxlength: [100, "Mother's occupation cannot exceed 100 characters"],
    default: null
  },
  aadharNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{12}$/, 'Please provide a valid 12-digit Aadhar number'],
    default: null
  },
  
  // CERTIFICATE STATUS
  certificateStatus: {
    type: String,
    enum: {
      values: ['Certificate Pending', 'Applied', 'Received'],
      message: '{VALUE} is not a valid certificate status'
    },
    default: 'Certificate Pending'
  },
  certificateAppliedDate: {
    type: Date,
    default: null
  },
  certificateReceivedDate: {
    type: Date,
    default: null
  },
  certificateNumber: {
    type: String,
    trim: true,
    default: null
  },
  
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
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
  photo: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (this.studentId) return next();
  
  try {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const lastStudent = await this.constructor.findOne({})
      .sort({ createdAt: -1 })
      .select('studentId');
    
    let sequence = '001';
    if (lastStudent && lastStudent.studentId) {
      const lastSeq = parseInt(lastStudent.studentId.slice(-3));
      sequence = (lastSeq + 1).toString().padStart(3, '0');
    }
    
    this.studentId = `STU${year}${month}${sequence}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for enrollments
studentSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'studentId'
});

// Virtual for calculating total pending fees
studentSchema.virtual('totalPendingFees').get(async function() {
  const Enrollment = mongoose.model('Enrollment');
  const enrollments = await Enrollment.find({ 
    studentId: this._id,
    status: { $ne: 'Dropped' }
  });
  
  let total = 0;
  for (const enrollment of enrollments) {
    const pendingAmount = await enrollment.calculatePendingAmount();
    total += pendingAmount;
  }
  return total;
});

// // Indexes
// studentSchema.index({ studentId: 1 });
// studentSchema.index({ mobile: 1 });
// studentSchema.index({ name: 'text', email: 'text' });
// studentSchema.index({ status: 1 });
// studentSchema.index({ certificateStatus: 1 });
// studentSchema.index({ aadharNumber: 1 }, { sparse: true });
// studentSchema.index({ createdBy: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;