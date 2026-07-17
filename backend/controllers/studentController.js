const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Create new student
// @route   POST /api/students
// @access  Private
exports.createStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.files && req.files.photo) {
        try {
          fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      name, mobile, parentMobile, email, address, 
      fatherName, motherName, fatherOccupation, motherOccupation, aadharNumber,
      joiningDate, notes 
    } = req.body;

    // Check if Aadhar number already exists (if provided)
    if (aadharNumber) {
      const existingAadhar = await Student.findOne({ aadharNumber });
      if (existingAadhar) {
        // Clean up uploaded file
        if (req.files && req.files.photo) {
          try {
            fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
          } catch (err) {
            console.error('Error cleaning up file:', err);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'A student already exists with this Aadhar number'
        });
      }
    }

    // Handle photo upload
    let photoPath = null;
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      
      // Create student name based filename
      const imageName = `${Date.now()}_${name.replace(/\s+/g, '-')}${path.extname(photo.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/students');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      
      // Move the file to the desired location
      await photo.mv(uploadPath);
      photoPath = `/uploads/students/${imageName}`;
    }

    const studentData = {
      name,
      mobile,
      parentMobile,
      email,
      address,
      fatherName,
      motherName,
      fatherOccupation,
      motherOccupation,
      aadharNumber,
      joiningDate: joiningDate || Date.now(),
      notes,
      createdBy: req.user.id,
      photo: photoPath
    };

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.files && req.files.photo) {
      try {
        fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    next(error);
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      certificateStatus,
      search,
      sort = '-createdAt',
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by certificate status
    if (certificateStatus) {
      query.certificateStatus = certificateStatus;
    }

    // Search by name, mobile, email, studentId, aadhar
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { aadharNumber: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by joining date range
    if (startDate || endDate) {
      query.joiningDate = {};
      if (startDate) query.joiningDate.$gte = new Date(startDate);
      if (endDate) query.joiningDate.$lte = new Date(endDate);
    }

    const students = await Student.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student with profile details
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'enrollments',
        populate: {
          path: 'batchId',
          select: 'batchName courseName fees timing faculty'
        }
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get payment summary for each enrollment
    const enrollmentDetails = await Promise.all(
      student.enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id })
          .populate('receivedBy', 'name')
          .sort({ paymentDate: -1 });
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          enrollment,
          payments,
          totalPaid,
          pendingAmount,
          paymentStatus: pendingAmount <= 0 ? 'Paid' : 'Pending'
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        student,
        enrollments: enrollmentDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.files && req.files.photo) {
        try {
          fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      name, mobile, parentMobile, email, address, 
      fatherName, motherName, fatherOccupation, motherOccupation, aadharNumber,
      status, notes 
    } = req.body;

    // Find existing student
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      // Clean up uploaded file
      if (req.files && req.files.photo) {
        try {
          fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if mobile number is being changed and already exists
    if (mobile && mobile !== existingStudent.mobile) {
      const mobileExists = await Student.findOne({ 
        mobile, 
        _id: { $ne: req.params.id } 
      });
      if (mobileExists) {
        // Clean up uploaded file
        if (req.files && req.files.photo) {
          try {
            fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
          } catch (err) {
            console.error('Error cleaning up file:', err);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Another student already exists with this mobile number'
        });
      }
    }

    // Check if Aadhar number is being changed and already exists
    if (aadharNumber && aadharNumber !== existingStudent.aadharNumber) {
      const aadharExists = await Student.findOne({ 
        aadharNumber, 
        _id: { $ne: req.params.id } 
      });
      if (aadharExists) {
        // Clean up uploaded file
        if (req.files && req.files.photo) {
          try {
            fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
          } catch (err) {
            console.error('Error cleaning up file:', err);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Another student already exists with this Aadhar number'
        });
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (mobile) updateFields.mobile = mobile;
    if (parentMobile !== undefined) updateFields.parentMobile = parentMobile;
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    if (fatherName !== undefined) updateFields.fatherName = fatherName;
    if (motherName !== undefined) updateFields.motherName = motherName;
    if (fatherOccupation !== undefined) updateFields.fatherOccupation = fatherOccupation;
    if (motherOccupation !== undefined) updateFields.motherOccupation = motherOccupation;
    if (aadharNumber !== undefined) updateFields.aadharNumber = aadharNumber;
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    updateFields.updatedBy = req.user.id;

    // Handle photo upload
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      
      // Delete old photo if exists
      if (existingStudent.photo) {
        const oldPhotoPath = path.join(__dirname, '..', existingStudent.photo);
        if (fs.existsSync(oldPhotoPath)) {
          try {
            fs.unlinkSync(oldPhotoPath);
          } catch (err) {
            console.error('Error deleting old photo:', err);
          }
        }
      }
      
      // Create new photo filename
      const studentName = name || existingStudent.name;
      const imageName = `${Date.now()}_${studentName.replace(/\s+/g, '-')}${path.extname(photo.name)}`;
      const uploadDir = path.join(__dirname, '../public/uploads/students');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uploadPath = path.join(uploadDir, imageName);
      
      // Move the file to the desired location
      await photo.mv(uploadPath);
      updateFields.photo = `/uploads/students/${imageName}`;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.files && req.files.photo) {
      try {
        fs.unlinkSync(req.files.photo.tempFilePath || req.files.photo.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Super Admin
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      studentId: req.params.id,
      status: 'Running'
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete student with active enrollments. Please drop enrollments first.'
      });
    }

    // Delete student photo if exists
    if (student.photo) {
      const photoPath = path.join(__dirname, '..', student.photo);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
        } catch (err) {
          console.error('Error deleting student photo:', err);
        }
      }
    }

    // Delete all enrollments and payments for this student
    const enrollments = await Enrollment.find({ studentId: req.params.id });
    for (const enrollment of enrollments) {
      await Payment.deleteMany({ enrollmentId: enrollment._id });
    }
    await Enrollment.deleteMany({ studentId: req.params.id });
    
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student and associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student photo only
// @route   DELETE /api/students/:id/photo
// @access  Private
exports.deleteStudentPhoto = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.photo) {
      const photoPath = path.join(__dirname, '..', student.photo);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
        } catch (err) {
          console.error('Error deleting photo file:', err);
        }
      }
      
      student.photo = null;
      student.updatedBy = req.user.id;
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: 'Student photo deleted successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student ledger
// @route   GET /api/students/:id/ledger
// @access  Private
exports.getStudentLedger = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const enrollments = await Enrollment.find({ studentId: req.params.id })
      .populate('batchId', 'batchName courseName');

    const ledger = await Promise.all(
      enrollments.map(async (enrollment) => {
        const payments = await Payment.find({ enrollmentId: enrollment._id })
          .populate('receivedBy', 'name')
          .sort({ paymentDate: -1 });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = enrollment.finalFees - totalPaid;

        return {
          enrollment: {
            id: enrollment._id,
            batchName: enrollment.batchId.batchName,
            courseName: enrollment.batchId.courseName,
            batchFees: enrollment.batchFees,
            discount: enrollment.discount,
            finalFees: enrollment.finalFees,
            joiningDate: enrollment.joiningDate,
            status: enrollment.status
          },
          payments,
          summary: {
            totalFees: enrollment.finalFees,
            totalPaid,
            pendingAmount,
            paymentStatus: pendingAmount <= 0 ? 'Completed' : 
                          totalPaid > 0 ? 'Partial' : 'Unpaid'
          }
        };
      })
    );

    const totalFees = ledger.reduce((sum, l) => sum + l.summary.totalFees, 0);
    const totalPaid = ledger.reduce((sum, l) => sum + l.summary.totalPaid, 0);
    const totalPending = totalFees - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId,
          mobile: student.mobile
        },
        enrollments: ledger,
        overallSummary: {
          totalFees,
          totalPaid,
          totalPending
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CERTIFICATE STATUS CONTROLLERS
// ==========================================

// @desc    Update certificate status only
// @route   PATCH /api/students/:id/certificate
// @access  Private
exports.updateCertificateStatus = async (req, res, next) => {
  try {
    const { certificateStatus, certificateNumber } = req.body;

    // Validate certificate status
    const validStatuses = ['Certificate Pending', 'Applied', 'Received'];
    if (!validStatuses.includes(certificateStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid certificate status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const updateFields = {
      certificateStatus,
      updatedBy: req.user.id
    };

    // Set dates based on status
    if (certificateStatus === 'Applied') {
      updateFields.certificateAppliedDate = new Date();
      updateFields.certificateReceivedDate = null;
      updateFields.certificateNumber = null;
    } else if (certificateStatus === 'Received') {
      updateFields.certificateReceivedDate = new Date();
      if (certificateNumber) {
        updateFields.certificateNumber = certificateNumber;
      }
    } else if (certificateStatus === 'Certificate Pending') {
      updateFields.certificateAppliedDate = null;
      updateFields.certificateReceivedDate = null;
      updateFields.certificateNumber = null;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Certificate status updated to "${certificateStatus}"`,
      data: {
        certificateStatus: student.certificateStatus,
        certificateAppliedDate: student.certificateAppliedDate,
        certificateReceivedDate: student.certificateReceivedDate,
        certificateNumber: student.certificateNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students by certificate status
// @route   GET /api/students/certificate/status/:status
// @access  Private
exports.getStudentsByCertificateStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const validStatuses = ['Certificate Pending', 'Applied', 'Received'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid certificate status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const query = { certificateStatus: status };

    const students = await Student.find(query)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get certificate statistics
// @route   GET /api/students/certificate/stats
// @access  Private
exports.getCertificateStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      pendingCount,
      appliedCount,
      receivedCount
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ certificateStatus: 'Certificate Pending' }),
      Student.countDocuments({ certificateStatus: 'Applied' }),
      Student.countDocuments({ certificateStatus: 'Received' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        certificateStats: {
          pending: pendingCount,
          applied: appliedCount,
          received: receivedCount,
          pendingPercentage: totalStudents > 0 ? ((pendingCount / totalStudents) * 100).toFixed(2) : 0,
          appliedPercentage: totalStudents > 0 ? ((appliedCount / totalStudents) * 100).toFixed(2) : 0,
          receivedPercentage: totalStudents > 0 ? ((receivedCount / totalStudents) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};