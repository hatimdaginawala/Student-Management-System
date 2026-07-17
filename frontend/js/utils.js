// Utility Functions
class Utils {
  // Format currency
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  // Format date
  static formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    switch(format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY HH:MM':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  // Show toast notification
  static showToast(message, type = 'success', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="toast-icon">${this.getToastIcon(type)}</i>
        <span>${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  static getToastIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  // Show loading spinner
  static showLoading(elementId = 'loading') {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'flex';
    }
  }

  // Hide loading spinner
  static hideLoading(elementId = 'loading') {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }

  // Confirm dialog
  static async confirm(message = 'Are you sure?') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal confirm-modal">
          <div class="modal-header">
            <h3>Confirm</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button class="btn btn-danger" id="confirmBtn">Confirm</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('confirmBtn').onclick = () => {
        modal.remove();
        resolve(true);
      };
      
      document.getElementById('cancelBtn').onclick = () => {
        modal.remove();
        resolve(false);
      };
      
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };
    });
  }

  // Show modal
  static showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = content;
    document.body.appendChild(modal);
    return modal;
  }

  // Hide modal
  static hideModal(modal) {
    if (modal) {
      modal.remove();
    }
  }

  // Validate form
  static validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, value] of formData.entries()) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;
      
      // Required check
      if (fieldRules.required && !value) {
        errors[field] = fieldRules.message || `${field} is required`;
        continue;
      }
      
      // Pattern check
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors[field] = fieldRules.message || `Invalid ${field}`;
        continue;
      }
      
      // Custom validation
      if (fieldRules.validate && !fieldRules.validate(value)) {
        errors[field] = fieldRules.message || `Invalid ${field}`;
      }
    }
    
    return errors;
  }

  // Pagination helper
  static renderPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    let html = '';
    
    // Previous button
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
             onclick="event.preventDefault(); ${onPageChange}(${currentPage - 1})">
             Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                 onclick="event.preventDefault(); ${onPageChange}(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }
    
    // Next button
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
             onclick="event.preventDefault(); ${onPageChange}(${currentPage + 1})">
             Next</button>`;
    
    pagination.innerHTML = html;
  }

  // Debounce function
  static debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Generate random ID
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Escape HTML
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get query parameters
  static getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Set theme
  static setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Get theme
  static getTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  // Initialize theme
  static initTheme() {
    const theme = this.getTheme();
    this.setTheme(theme);
  }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  Utils.initTheme();
});