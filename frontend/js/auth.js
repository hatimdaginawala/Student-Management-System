// Authentication Module
class Auth {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    this.token = localStorage.getItem('token');
    
    // Initialize API token
    if (this.token) {
      api.setToken(this.token);
    }
    
    this.init();
  }

  init() {
    // Check if user is logged in
    if (!this.isAuthenticated() && !this.isLoginPage()) {
      this.redirectToLogin();
      return;
    }

    // If logged in and on login page, redirect to dashboard
    if (this.isAuthenticated() && this.isLoginPage()) {
      this.redirectToDashboard();
      return;
    }

    // Setup logout button
    this.setupLogout();
    
    // Update UI with user info
    this.updateUserUI();
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  isLoginPage() {
    return window.location.pathname.includes('login.html') || 
           window.location.pathname === '/' ||
           window.location.pathname.endsWith('/');
  }

  redirectToLogin() {
    window.location.href = CONFIG.ROUTES.LOGIN;
  }

  redirectToDashboard() {
    window.location.href = CONFIG.ROUTES.DASHBOARD;
  }

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success) {
        this.token = response.token;
        this.currentUser = response.user;
        
        api.setToken(this.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        this.redirectToDashboard();
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    this.redirectToLogin();
  }

  setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  updateUserUI() {
    if (!this.currentUser) return;

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) {
      userNameElement.textContent = this.currentUser.name;
    }
    if (userRoleElement) {
      userRoleElement.textContent = this.currentUser.role;
    }

    // Show/hide Super Admin features
    if (this.currentUser.role !== 'Super Admin') {
      const superAdminElements = document.querySelectorAll('.super-admin-only');
      superAdminElements.forEach(el => el.style.display = 'none');
    }
  }

  hasRole(roles) {
    return this.currentUser && roles.includes(this.currentUser.role);
  }

  isSuperAdmin() {
    return this.hasRole(['Super Admin']);
  }

  isAdmin() {
    return this.hasRole(['Super Admin', 'Admin']);
  }
}

// Create global auth instance
const auth = new Auth();