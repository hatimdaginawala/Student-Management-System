// Dashboard Module
class Dashboard {
  constructor() {
    this.icons = {
      students: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.36-6.5 7.5-6.5s7.5 2.9 7.5 6.5"/></svg>',
      batches: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5c.83 0 1.5-.67 1.5-1.5v-13Z"/></svg>',
      coinsToday: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="5.5"/><circle cx="15" cy="15" r="5.5"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>',
      bank: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9"/><path d="M3 19.5h18"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
      expenseCalendar: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3M16 3v3"/></svg>',
      staffSalary: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="7.5" r="3"/><path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15.5 4.7a3 3 0 0 1 0 5.6"/><path d="M17.5 14.3c2.2.55 3.8 2.4 3.8 5.7"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>'
    };
    this.init();
  }

  async init() {
    // Check authentication
    if (!auth.isAuthenticated()) {
      return;
    }

    // Setup event listeners
    this.setupEventListeners();

    // Load dashboard data
    await this.loadDashboard();
  }

  setupEventListeners() {
    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = Utils.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        Utils.setTheme(newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? this.icons.moon : this.icons.sun;
      });

      // Set initial icon
      const currentTheme = Utils.getTheme();
      themeToggle.innerHTML = currentTheme === 'light' ? this.icons.moon : this.icons.sun;
    }
  }

  async loadDashboard() {
    try {
      Utils.showLoading();

      const response = await api.get('/dashboard');

      if (response.success) {
        // Expense stats (This Month / Salary This Month) fill the two open
        // slots in the stats grid, but only for Super Admins — expense data
        // is restricted the same way the Expenses nav link is.
        let expenseStats = null;
        if (auth.currentUser?.role === 'Super Admin') {
          try {
            const expenseResponse = await api.get('/expenses/stats/summary');
            if (expenseResponse.success) {
              expenseStats = expenseResponse.data;
            }
          } catch (expenseError) {
            console.error('Error loading expense stats:', expenseError);
          }
        }

        this.renderStats(response.data.stats, expenseStats);
        this.renderRecentAdmissions(response.data.recentAdmissions);
        this.renderRecentPayments(response.data.recentPayments);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Utils.showToast('Failed to load dashboard data', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  renderStats(stats, expenseStats) {
    const container = document.getElementById('statsCards');
    if (!container) return;

    const statCards = [
      {
        label: 'Total Students',
        value: stats.totalStudents,
        icon: this.icons.students,
        className: 'primary',
        detail: `${stats.activeStudents} active`
      },
      {
        label: 'Running Batches',
        value: stats.runningBatches,
        icon: this.icons.batches,
        className: 'info',
        detail: `${stats.totalBatches} total`
      },
      {
        label: "Today's Collection",
        value: Utils.formatCurrency(stats.todayCollection),
        icon: this.icons.coinsToday,
        className: 'success'
      },
      {
        label: 'Monthly Collection',
        value: Utils.formatCurrency(stats.monthlyCollection),
        icon: this.icons.chart,
        className: 'warning',
        detail: `${stats.collectionRate}% collected`
      },
      {
        label: 'Total Revenue',
        value: Utils.formatCurrency(stats.totalRevenue),
        icon: this.icons.bank,
        className: 'primary'
      },
      {
        label: 'Pending Fees',
        value: Utils.formatCurrency(stats.pendingFees),
        icon: this.icons.alert,
        className: 'danger'
      }
    ];

    // Fill the 2 remaining grid slots with expense data (Super Admin only)
    if (expenseStats) {
      statCards.push(
        {
          label: 'Expenses (This Month)',
          value: Utils.formatCurrency(expenseStats.monthly.total),
          icon: this.icons.expenseCalendar,
          className: 'danger',
          detail: `${expenseStats.monthly.count} entr${expenseStats.monthly.count === 1 ? 'y' : 'ies'}`
        },
        {
          label: 'Salary (This Month)',
          value: Utils.formatCurrency(expenseStats.salary.total),
          icon: this.icons.staffSalary,
          className: 'info',
          detail: `${expenseStats.salary.count} payment${expenseStats.salary.count === 1 ? '' : 's'}`
        }
      );
    }

    const accentVar = {
      primary: 'var(--brand-600)',
      success: 'var(--brand-600)',
      warning: 'var(--gold-600)',
      danger: 'var(--brick-600)',
      info: 'var(--slate-600)'
    };

    container.innerHTML = statCards.map(card => `
      <div class="stat-card" style="--stat-accent: ${accentVar[card.className]};">
        <div class="stat-icon ${card.className}">
          ${card.icon}
        </div>
        <div class="stat-info">
          <h4>${card.label}</h4>
          <p>${card.value}</p>
          ${card.detail ? `<small>${card.detail}</small>` : ''}
        </div>
      </div>
    `).join('');
  }

  renderRecentAdmissions(admissions) {
    const tbody = document.getElementById('recentAdmissions');
    if (!tbody) return;

    if (!admissions || admissions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No recent admissions</td></tr>';
      return;
    }

    tbody.innerHTML = admissions.map(student => `
      <tr>
        <td><span class="badge badge-primary">${student.studentId || 'N/A'}</span></td>
        <td>
          <strong>${Utils.escapeHtml(student.name)}</strong>
        </td>
        <td>${student.mobile}</td>
        <td>${Utils.formatDate(student.joiningDate)}</td>
      </tr>
    `).join('');
  }

  renderRecentPayments(payments) {
    const tbody = document.getElementById('recentPayments');
    if (!tbody) return;

    if (!payments || payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No recent payments</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(payment => `
      <tr>
        <td><span class="badge badge-info">${payment.receiptNumber || 'N/A'}</span></td>
        <td>
          <strong>${Utils.escapeHtml(payment.enrollmentId?.studentId?.name || 'N/A')}</strong>
        </td>
        <td><strong>${Utils.formatCurrency(payment.amount)}</strong></td>
        <td><span class="badge badge-success">${payment.paymentMode}</span></td>
      </tr>
    `).join('');
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});