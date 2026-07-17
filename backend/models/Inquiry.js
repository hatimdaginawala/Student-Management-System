const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  inquiryId: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  parentContact: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    default: null
  },
  qualification: {
    type: String,
    trim: true,
    maxlength: [200, 'Qualification cannot exceed 200 characters'],
    default: null
  },
  courseName: {
    type: String,
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters'],
    default: null
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    default: null
  },
  joiningDate: {
    type: Date,
    default: null
  },
  inquiryDate: {
    type: Date,
    required: [true, 'Please provide inquiry date'],
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Inquired', 'Joined', 'Cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Inquired'
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters'],
    default: null
  },
  followUpDate: {
    type: Date,
    default: null
  },
  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters'],
    default: null
  },
  convertedToStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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

// Auto-generate inquiry ID
inquirySchema.pre('save', async function(next) {
  if (this.inquiryId) return next();
  
  try {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const lastInquiry = await this.constructor.findOne({}).sort({ createdAt: -1 }).select('inquiryId');
    
    let sequence = '001';
    if (lastInquiry && lastInquiry.inquiryId) {
      const lastSeq = parseInt(lastInquiry.inquiryId.slice(-3));
      sequence = (lastSeq + 1).toString().padStart(3, '0');
    }
    
    this.inquiryId = `INQ${year}${month}${sequence}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-set joining date when status changes to Joined
inquirySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Joined' && !this.joiningDate) {
    this.joiningDate = new Date();
  }
  next();
});

// // Indexes
// inquirySchema.index({ inquiryId: 1 });
// inquirySchema.index({ contactNumber: 1 });
// inquirySchema.index({ status: 1 });
// inquirySchema.index({ inquiryDate: -1 });
// inquirySchema.index({ courseName: 1 });
// inquirySchema.index({ createdBy: 1 });
// inquirySchema.index({ name: 'text', courseName: 'text', comments: 'text' });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;