// Application Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  APP_NAME: 'Student Management System',
  VERSION: '1.0.0',
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  
  // Theme
  THEME: 'light', // 'light' or 'dark'
  
  // Toast duration
  TOAST_DURATION: 3000,
  
  // Date format
  DATE_FORMAT: 'en-IN',
  
  // Currency
  CURRENCY: 'INR',
  
  // Routes
  ROUTES: {
    LOGIN: '/login.html',
    DASHBOARD: '/dashboard.html',
    STUDENTS: '/students.html',
    STUDENT_PROFILE: '/student-profile.html',
    BATCHES: '/batches.html',
    PAYMENTS: '/payments.html',
    REPORTS: '/reports.html',
    USERS: '/users.html',
    SETTINGS: '/settings.html'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}