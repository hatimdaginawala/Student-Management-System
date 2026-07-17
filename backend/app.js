const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestContext, responseTime } = require('./middleware/auditMiddleware');
const { sanitize } = require('./middleware/validationMiddleware');

// Import routes
const routes = require('./routes/index');

// Initialize Express app
const app = express();
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached (5MB)',
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Security middleware (configure helmet to allow frontend)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// CORS configuration - Allow all origins in development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://localhost:5500',  // Live Server default
      'http://127.0.0.1:5500',  // Live Server default
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      // Allow requests with no origin (file://, postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any localhost origin
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow all origins in development
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Request tracking middleware
app.use(requestContext);
app.use(responseTime);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization middleware
app.use(sanitize);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage()
  });
});

// API Routes
app.use('/api', routes);

// API Documentation endpoint
// app.get('/api/docs', (req, res) => {
//   res.json({
//     success: true,
//     message: 'API Documentation',
//     version: '1.0.0',
//     baseUrl: '/api',
//     endpoints: {
//       auth: {
//         login: 'POST /api/auth/login',
//         me: 'GET /api/auth/me',
//         changePassword: 'PUT /api/auth/change-password',
//         forgotPassword: 'POST /api/auth/forgot-password',
//         resetPassword: 'PUT /api/auth/reset-password/:token',
//         logout: 'GET /api/auth/logout'
//       },
//       users: {
//         create: 'POST /api/users',
//         getAll: 'GET /api/users',
//         getOne: 'GET /api/users/:id',
//         update: 'PUT /api/users/:id',
//         updateStatus: 'PATCH /api/users/status/:id',
//         delete: 'DELETE /api/users/:id',
//         resetPassword: 'POST /api/users/reset-password',
//         profile: 'GET /api/users/profile',
//         updateProfile: 'PUT /api/users/profile'
//       },
//       students: {
//         create: 'POST /api/students',
//         getAll: 'GET /api/students',
//         getOne: 'GET /api/students/:id',
//         update: 'PUT /api/students/:id',
//         delete: 'DELETE /api/students/:id',
//         ledger: 'GET /api/students/:id/ledger'
//       },
//       batches: {
//         create: 'POST /api/batches',
//         getAll: 'GET /api/batches',
//         getOne: 'GET /api/batches/:id',
//         update: 'PUT /api/batches/:id',
//         delete: 'DELETE /api/batches/:id',
//         students: 'GET /api/batches/:id/students',
//         revenue: 'GET /api/batches/:id/revenue'
//       },
//       enrollments: {
//         create: 'POST /api/enrollments',
//         getAll: 'GET /api/enrollments',
//         getOne: 'GET /api/enrollments/:id',
//         update: 'PUT /api/enrollments/:id',
//         delete: 'DELETE /api/enrollments/:id',
//         byStudent: 'GET /api/enrollments/student/:studentId',
//         byBatch: 'GET /api/enrollments/batch/:batchId'
//       },
//       payments: {
//         create: 'POST /api/payments',
//         getAll: 'GET /api/payments',
//         getOne: 'GET /api/payments/:id',
//         update: 'PUT /api/payments/:id',
//         delete: 'DELETE /api/payments/:id',
//         byEnrollment: 'GET /api/payments/enrollment/:id',
//         receipt: 'GET /api/payments/:id/receipt'
//       },
//       dashboard: {
//         get: 'GET /api/dashboard'
//       },
//       reports: {
//         pendingFees: 'GET /api/reports/pending-fees',
//         studentLedger: 'GET /api/reports/student-ledger/:studentId',
//         paymentHistory: 'GET /api/reports/payment-history',
//         batchRevenue: 'GET /api/reports/batch-revenue',
//         monthlyCollection: 'GET /api/reports/monthly-collection',
//         dailyCollection: 'GET /api/reports/daily-collection',
//         studentWise: 'GET /api/reports/student-wise-collection',
//         batchWise: 'GET /api/reports/batch-wise-collection',
//         export: 'GET /api/reports/export/:type'
//       }
//     }
//   });
// });

// Serve frontend pages
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  
  // Serve index.html for all other routes (SPA)
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 404 handler for undefined API routes
app.use('/api/*', notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;