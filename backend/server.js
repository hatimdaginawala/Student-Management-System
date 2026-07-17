const app = require('./app');
const connectDB = require('./config/db');
const Logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  Logger.error('UNCAUGHT EXCEPTION!', {
    error: err.message,
    stack: err.stack
  });
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Don't exit immediately, allow graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

// Set port
const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
      
      Logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiUrl: `http://localhost:${PORT}/api`
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      Logger.error('UNHANDLED REJECTION!', {
        error: err.message,
        stack: err.stack
      });
      console.error('UNHANDLED REJECTION! 💥');
      console.error(err.name, err.message);
      
      // Don't crash the server for unhandled rejections
      // Just log the error
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      Logger.info('SIGTERM RECEIVED. Shutting down gracefully...');
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
      
      server.close(() => {
        Logger.info('Process terminated!');
        console.log('💤 Process terminated!');
        process.exit(0);
      });
    });

  } catch (error) {
    Logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;