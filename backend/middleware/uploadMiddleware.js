const multer = require('multer'); // You'll need to install multer: npm install multer
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/students',
    'uploads/documents',
    'uploads/temp'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for student photos
const studentPhotoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/students');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for documents
const documentStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/documents');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|txt|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, xls, xlsx, txt, csv)'), false);
  }
};

// Upload middleware for student photos
const uploadStudentPhoto = multer({
  storage: studentPhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
}).single('photo');

// Upload middleware for documents
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: documentFilter
}).single('document');

// Upload middleware for multiple documents
const uploadMultipleDocuments = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: documentFilter
}).array('documents', 5); // Max 5 files

// Handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB for photos and 10MB for documents.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

// Clean up uploaded file on error
const cleanupOnError = (req, res, next) => {
  const cleanup = () => {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
  };

  // Listen for response finish
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      cleanup();
    }
  });

  next();
};

module.exports = {
  uploadStudentPhoto,
  uploadDocument,
  uploadMultipleDocuments,
  handleUploadError,
  cleanupOnError
};

