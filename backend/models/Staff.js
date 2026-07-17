const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide staff name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
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
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  alternateMobile: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    default: null
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters'],
    default: null
  },
  designation: {
    type: String,
    required: [true, 'Please provide designation'],
    enum: {
      values: [
        'Teacher',
        'Lab Assistant',
        'Receptionist',
        'Accountant',
        'Office Staff',
        'Peon',
        'Other'
      ],
      message: '{VALUE} is not a valid designation'
    }
  },
  course: {
    type: String,
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters'],
    default: null
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative'],
    default: null
  },
  joiningDate: {
    type: Date,
    required: [true, 'Please provide joining date'],
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'On Leave'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  },
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is not a valid gender'
    },
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  aadharNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{12}$/, 'Please provide a valid 12-digit Aadhar number'],
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// Auto-generate staff ID
staffSchema.pre('save', async function(next) {
  if (this.staffId) return next();
  
  try {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const lastStaff = await this.constructor.findOne({}).sort({ createdAt: -1 }).select('staffId');
    
    let sequence = '001';
    if (lastStaff && lastStaff.staffId) {
      const lastSeq = parseInt(lastStaff.staffId.slice(-3));
      sequence = (lastSeq + 1).toString().padStart(3, '0');
    }
    
    this.staffId = `STF${year}${month}${sequence}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for expenses
staffSchema.virtual('expenses', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'staffId'
});

// Indexes
// staffSchema.index({ staffId: 1 });
// staffSchema.index({ mobile: 1 });
// staffSchema.index({ email: 1 });
// staffSchema.index({ designation: 1 });
// staffSchema.index({ status: 1 });
// staffSchema.index({ createdBy: 1 });

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;