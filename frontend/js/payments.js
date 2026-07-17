// Payments Module
class Payments {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.viewingId = null;
    this.enrollments = [];

    this.icons = {
      coinsToday: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="5.5"/><circle cx="15" cy="15" r="5.5"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>',
      bank: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9"/><path d="M3 19.5h18"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
      view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>',
      edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L19.5 8.5a2.12 2.12 0 0 0-3-3L5.5 16l-1.5 4Z" stroke-linejoin="round"/><path d="M14 5.5l4.5 4.5"/></svg>',
      delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M18 7l-.8 12.2A1.8 1.8 0 0 1 15.4 21H8.6a1.8 1.8 0 0 1-1.8-1.8L6 7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke-linecap="round"/></svg>',
      receipt: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2.5h12v19l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V2.5Z" stroke-linejoin="round"/><path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>'
    };

    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) {
      return;
    }

    this.updateSidebar();
    this.setupEventListeners();

    // Load data
    await this.loadEnrollments();
    await this.loadPayments();
    await this.loadStats();
  }

  updateSidebar() {
    const user = auth.currentUser;
    if (!user) return;

    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');

    if (userAvatar) {
      userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role;
  }

  setupEventListeners() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
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

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        this.currentPage = 1;
        this.loadPayments();
      }, 500));
    }

    // Filters
    document.getElementById('paymentModeFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadPayments();
    });

    document.getElementById('startDateFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadPayments();
    });

    document.getElementById('endDateFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadPayments();
    });

    // Add payment button
    document.getElementById('addPaymentBtn')?.addEventListener('click', () => this.openAddModal());

    // Enrollment select change - show enrollment info
    document.getElementById('enrollmentSelect')?.addEventListener('change', () => this.onEnrollmentChange());

    // Payment mode change - show/hide relevant fields
    document.getElementById('paymentMode')?.addEventListener('change', (e) => {
      const transactionIdGroup = document.getElementById('transactionIdGroup');
      const chequeFields = document.getElementById('chequeFields');

      if (transactionIdGroup) {
        transactionIdGroup.style.display =
          (e.target.value === 'UPI' || e.target.value === 'Card' || e.target.value === 'Bank Transfer')
          ? 'block' : 'none';
      }

      if (chequeFields) {
        chequeFields.style.display = e.target.value === 'Cheque' ? 'block' : 'none';
      }
    });

    // Modal buttons
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());

    // Save payment
    document.getElementById('savePaymentBtn')?.addEventListener('click', () => this.savePayment());

    // Form submission
    document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePayment();
    });

    // Print receipt
    document.getElementById('printReceiptBtn')?.addEventListener('click', () => window.print());

    // Close modals on overlay click
    document.getElementById('paymentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'paymentModal') this.closeModal();
    });
    document.getElementById('viewPaymentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewPaymentModal') this.closeViewModal();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  async loadEnrollments() {
    try {
      // Get active enrollments (Running) for payment
      const response = await api.get('/enrollments', { limit: 1000, status: 'Running' });
      if (response.success) {
        this.enrollments = response.data;
        this.populateEnrollmentDropdown();
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  }

  populateEnrollmentDropdown() {
    const select = document.getElementById('enrollmentSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select Enrollment</option>' +
      this.enrollments.map(e => {
        const student = e.studentId || {};
        const batch = e.batchId || {};
        const payment = e.paymentSummary || {};
        const pendingAmount = payment.pendingAmount || 0;

        return `
          <option value="${e._id}"
                  data-student="${student.name || 'N/A'}"
                  data-batch="${batch.batchName || 'N/A'}"
                  data-fees="${e.finalFees || 0}"
                  data-paid="${payment.totalPaid || 0}"
                  data-pending="${pendingAmount}">
            ${student.name || 'N/A'} - ${batch.batchName || 'N/A'} (Pending: ₹${pendingAmount.toLocaleString('en-IN')})
          </option>
        `;
      }).join('');
  }

  onEnrollmentChange() {
    const select = document.getElementById('enrollmentSelect');
    const infoDiv = document.getElementById('enrollmentInfo');
    const infoText = document.getElementById('enrollmentInfoText');
    const pendingAmountText = document.getElementById('pendingAmountText');
    const amountInput = document.getElementById('amount');

    if (!select || !infoDiv || !infoText) return;

    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption && selectedOption.value) {
      const student = selectedOption.dataset.student;
      const batch = selectedOption.dataset.batch;
      const fees = parseFloat(selectedOption.dataset.fees);
      const paid = parseFloat(selectedOption.dataset.paid);
      const pending = parseFloat(selectedOption.dataset.pending);

      infoDiv.style.display = 'block';
      infoText.innerHTML = `
        <strong>Student:</strong> ${student}<br>
        <strong>Batch:</strong> ${batch}<br>
        <strong>Total Fees:</strong> ${Utils.formatCurrency(fees)}<br>
        <strong>Paid:</strong> ${Utils.formatCurrency(paid)}<br>
        <strong>Pending:</strong> ${Utils.formatCurrency(pending)}
      `;

      if (pendingAmountText) {
        pendingAmountText.textContent = `Pending Amount: ${Utils.formatCurrency(pending)}`;
      }

      if (amountInput) {
        amountInput.max = pending;
        amountInput.value = '';
      }
    } else {
      infoDiv.style.display = 'none';
      if (pendingAmountText) pendingAmountText.textContent = '';
      if (amountInput) amountInput.value = '';
    }
  }

  async loadStats() {
    try {
      const response = await api.get('/dashboard');
      if (response.success) {
        const stats = response.data.stats;
        this.renderStats(stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  renderStats(stats) {
    const container = document.getElementById('paymentStats');
    if (!container) return;

    const statCards = [
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
        className: 'primary'
      },
      {
        label: 'Total Revenue',
        value: Utils.formatCurrency(stats.totalRevenue),
        icon: this.icons.bank,
        className: 'info'
      },
      {
        label: 'Pending Fees',
        value: Utils.formatCurrency(stats.pendingFees),
        icon: this.icons.alert,
        className: 'danger'
      }
    ];

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
        </div>
      </div>
    `).join('');
  }

  async loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      };

      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.search = search;

      const paymentMode = document.getElementById('paymentModeFilter')?.value;
      if (paymentMode) params.paymentMode = paymentMode;

      const startDate = document.getElementById('startDateFilter')?.value;
      if (startDate) params.startDate = startDate;

      const endDate = document.getElementById('endDateFilter')?.value;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/payments', params);

      if (response.success) {
        this.totalPages = response.pagination.totalPages;
        this.renderPayments(response.data);
        this.renderPagination();
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading payments</td></tr>';
      Utils.showToast(error.message || 'Failed to load payments', 'error');
    }
  }

  renderPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (!payments || payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No payments found</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(payment => {
      const enrollment = payment.enrollmentId || {};
      const student = enrollment.studentId || {};
      const batch = enrollment.batchId || {};

      return `
        <tr>
          <td>
            <span class="badge badge-info">${payment.receiptNumber || 'N/A'}</span>
          </td>
          <td>${Utils.formatDate(payment.paymentDate)}</td>
          <td>
            <strong>${Utils.escapeHtml(student.name || 'N/A')}</strong>
            <br><small class="text-muted">${student.studentId || ''}</small>
          </td>
          <td>${Utils.escapeHtml(batch.batchName || 'N/A')}</td>
          <td><strong class="text-success">${Utils.formatCurrency(payment.amount)}</strong></td>
          <td><span class="badge badge-primary">${payment.paymentMode}</span></td>
          <td>${payment.receivedBy?.name || 'N/A'}</td>
          <td>
            <div class="btn-group" style="display: flex; gap: 3px;">
              <button class="btn-icon" title="View Receipt" onclick="paymentsModule.viewPayment('${payment._id}')">${this.icons.view}</button>
              <button class="btn-icon" title="Edit" onclick="paymentsModule.openEditModal('${payment._id}')">${this.icons.edit}</button>
              <button class="btn-icon" title="Delete" onclick="paymentsModule.deletePayment('${payment._id}')">${this.icons.delete}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''}
             onclick="paymentsModule.goToPage(${this.currentPage - 1})">← Previous</button>`;

    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                 onclick="paymentsModule.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }

    html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}
             onclick="paymentsModule.goToPage(${this.currentPage + 1})">Next →</button>`;

    container.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPayments();
  }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'Record Payment';
    document.getElementById('saveBtnText').textContent = 'Record Payment';

    // Reset form
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentId').value = '';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];

    // Hide conditional fields
    document.getElementById('transactionIdGroup').style.display = 'none';
    document.getElementById('chequeFields').style.display = 'none';
    document.getElementById('enrollmentInfo').style.display = 'none';

    // Reload enrollments to get latest pending amounts
    this.loadEnrollments();

    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/payments/${id}`);

      if (response.success) {
        const payment = response.data.payment || response.data;
        const enrollment = payment.enrollmentId || {};

        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit Payment';
        document.getElementById('saveBtnText').textContent = 'Update Payment';

        setTimeout(() => {
          document.getElementById('paymentId').value = payment._id;
          document.getElementById('enrollmentSelect').value = enrollment._id || '';
          document.getElementById('amount').value = payment.amount || '';
          document.getElementById('paymentMode').value = payment.paymentMode || '';
          document.getElementById('paymentDate').value = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '';
          document.getElementById('transactionId').value = payment.transactionId || '';
          document.getElementById('chequeNumber').value = payment.chequeNumber || '';
          document.getElementById('chequeDate').value = payment.chequeDate ? new Date(payment.chequeDate).toISOString().split('T')[0] : '';
          document.getElementById('bankName').value = payment.bankName || '';
          document.getElementById('paymentRemarks').value = payment.remarks || '';

          // Show/hide relevant fields
          const mode = payment.paymentMode;
          document.getElementById('transactionIdGroup').style.display =
            (mode === 'UPI' || mode === 'Card' || mode === 'Bank Transfer') ? 'block' : 'none';
          document.getElementById('chequeFields').style.display = mode === 'Cheque' ? 'block' : 'none';

          // Trigger enrollment change to show info
          this.onEnrollmentChange();
        }, 100);

        this.hideModalError();
        this.showModal();
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      Utils.showToast('Failed to load payment details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  async viewPayment(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/payments/${id}`);

      if (response.success) {
        const data = response.data;
        const payment = data.payment || data;

        this.viewingId = id;

        const detailsContainer = document.getElementById('paymentDetails');
        detailsContainer.innerHTML = this.buildReceiptHTML(payment);

        this.showViewModal();
      }
    } catch (error) {
      console.error('Error viewing payment:', error);
      Utils.showToast('Failed to load payment details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  buildReceiptHTML(payment) {
    const enrollment = payment.enrollmentId || {};
    const student = enrollment.studentId || {};
    const batch = enrollment.batchId || {};

    return `
      <div class="receipt-container" id="printableReceipt">
        <div class="receipt-header">
          <h2 style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="display: inline-flex; width: 22px; height: 22px;">${this.icons.receipt}</span>
            Payment Receipt
          </h2>
          <div class="receipt-number">${payment.receiptNumber || 'N/A'}</div>
        </div>

        <div class="receipt-body">
          <div class="receipt-section">
            <h4>Student Information</h4>
            <div class="receipt-row">
              <span>Name:</span>
              <strong>${Utils.escapeHtml(student.name || 'N/A')}</strong>
            </div>
            <div class="receipt-row">
              <span>Student ID:</span>
              <span>${student.studentId || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span>Mobile:</span>
              <span>${student.mobile || 'N/A'}</span>
            </div>
          </div>

          <div class="receipt-section">
            <h4>Batch Information</h4>
            <div class="receipt-row">
              <span>Batch Name:</span>
              <strong>${Utils.escapeHtml(batch.batchName || 'N/A')}</strong>
            </div>
            <div class="receipt-row">
              <span>Course:</span>
              <span>${Utils.escapeHtml(batch.courseName || 'N/A')}</span>
            </div>
          </div>

          <div class="receipt-section">
            <h4>Payment Details</h4>
            <div class="receipt-row highlight">
              <span>Amount Paid:</span>
              <strong style="font-size: 1.2rem; color: var(--success);">${Utils.formatCurrency(payment.amount)}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Mode:</span>
              <span>${payment.paymentMode}</span>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <span>${Utils.formatDate(payment.paymentDate, 'DD/MM/YYYY')}</span>
            </div>
            ${payment.transactionId ? `
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <span>${payment.transactionId}</span>
            </div>` : ''}
            ${payment.chequeNumber ? `
            <div class="receipt-row">
              <span>Cheque Number:</span>
              <span>${payment.chequeNumber}</span>
            </div>` : ''}
            ${payment.bankName ? `
            <div class="receipt-row">
              <span>Bank:</span>
              <span>${payment.bankName}</span>
            </div>` : ''}
            ${payment.remarks ? `
            <div class="receipt-row">
              <span>Remarks:</span>
              <span>${Utils.escapeHtml(payment.remarks)}</span>
            </div>` : ''}
          </div>
        </div>

        <div class="receipt-footer">
          <div class="receipt-row">
            <span>Received By:</span>
            <strong>${payment.receivedBy?.name || 'N/A'}</strong>
          </div>
          <div class="receipt-row">
            <span>Date & Time:</span>
            <span>${Utils.formatDate(payment.createdAt, 'DD/MM/YYYY HH:MM')}</span>
          </div>
          <p class="receipt-thanks">Thank you for your payment!</p>
          <small>This is a computer-generated receipt.</small>
        </div>
      </div>
    `;
  }

  async savePayment() {
    const enrollmentId = document.getElementById('enrollmentSelect')?.value;
    const amount = document.getElementById('amount')?.value;
    const paymentMode = document.getElementById('paymentMode')?.value;
    const paymentDate = document.getElementById('paymentDate')?.value;
    const transactionId = document.getElementById('transactionId')?.value?.trim();
    const chequeNumber = document.getElementById('chequeNumber')?.value?.trim();
    const chequeDate = document.getElementById('chequeDate')?.value;
    const bankName = document.getElementById('bankName')?.value?.trim();
    const remarks = document.getElementById('paymentRemarks')?.value?.trim();

    // Validation
    if (!enrollmentId) {
      this.showModalError('Please select an enrollment');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      this.showModalError('Please enter a valid amount');
      return;
    }
    if (!paymentMode) {
      this.showModalError('Please select payment mode');
      return;
    }

    const data = {
      enrollmentId,
      amount: parseFloat(amount),
      paymentMode,
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
      remarks: remarks || null
    };

    // Add conditional fields
    if (transactionId) data.transactionId = transactionId;
    if (paymentMode === 'Cheque') {
      if (chequeNumber) data.chequeNumber = chequeNumber;
      if (chequeDate) data.chequeDate = new Date(chequeDate).toISOString();
      if (bankName) data.bankName = bankName;
    }

    console.log('Saving payment:', data);

    this.setSaveLoading(true);
    this.hideModalError();

    try {
      let response;
      if (this.editingId) {
        response = await api.put(`/payments/${this.editingId}`, data);
      } else {
        response = await api.post('/payments', data);
      }

      if (response.success) {
        this.closeModal();
        Utils.showToast(
          this.editingId ? 'Payment updated successfully' : 'Payment recorded successfully',
          'success'
        );
        await this.loadPayments();
        await this.loadStats();
        await this.loadEnrollments();
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showModalError(error.message || 'Failed to save payment');
    } finally {
      this.setSaveLoading(false);
    }
  }

  async deletePayment(id) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this payment? This action cannot be undone.');

    if (confirmed) {
      try {
        const response = await api.delete(`/payments/${id}`);

        if (response.success) {
          Utils.showToast('Payment deleted successfully', 'success');
          await this.loadPayments();
          await this.loadStats();
          await this.loadEnrollments();
        }
      } catch (error) {
        Utils.showToast(error.message || 'Failed to delete payment', 'error');
      }
    }
  }

  showModal() {
    document.getElementById('paymentModal').style.display = 'flex';
  }

  closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
    this.editingId = null;
  }

  showViewModal() {
    document.getElementById('viewPaymentModal').style.display = 'flex';
  }

  closeViewModal() {
    document.getElementById('viewPaymentModal').style.display = 'none';
    this.viewingId = null;
  }

  showModalError(message) {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.querySelector('.alert').textContent = message;
    }
  }

  hideModalError() {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  setSaveLoading(isLoading) {
    const btn = document.getElementById('savePaymentBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveSpinner');

    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

// Initialize
let paymentsModule;
document.addEventListener('DOMContentLoaded', () => {
  paymentsModule = new Payments();
});