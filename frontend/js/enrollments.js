// Enrollments Module
class Enrollments {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.viewingId = null;
    this.students = [];
    this.batches = [];
    
    // Check if current user is Super Admin
    this.isSuperAdmin = auth.currentUser?.role === 'Super Admin';
    
    this.icons = {
      total: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5"/><path d="M8.5 11l2 2 4-4.5M8.5 16.5h7"/></svg>',
      active: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" stroke-linejoin="round"/></svg>',
      completed: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      dropped: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6" stroke-linecap="round"/></svg>',
      view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>',
      edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L19.5 8.5a2.12 2.12 0 0 0-3-3L5.5 16l-1.5 4Z" stroke-linejoin="round"/><path d="M14 5.5l4.5 4.5"/></svg>',
      delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M18 7l-.8 12.2A1.8 1.8 0 0 1 15.4 21H8.6a1.8 1.8 0 0 1-1.8-1.8L6 7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke-linecap="round"/></svg>',
      money: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 14.5h4"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5"/><path d="M8.5 11l2 2 4-4.5M8.5 16.5h7"/></svg>',
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
    this.applyRoleBasedUI();
    this.setupEventListeners();

    await this.loadStudents();
    await this.loadBatches();
    await this.loadEnrollments();
    await this.loadStats();
  }

  // ==========================================
  // ROLE-BASED UI CHANGES
  // ==========================================
  applyRoleBasedUI() {
    if (!this.isSuperAdmin) {
      // 1. Hide financial columns from table header
      this.hideFinancialColumns();
      
      // 2. Hide Super Admin sidebar items
      document.querySelectorAll('.super-admin-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  hideFinancialColumns() {
    // Add CSS to hide financial columns
    const style = document.createElement('style');
    style.id = 'role-hide-financial';
    style.textContent = `
      .col-fees, .col-discount, .col-final-fees, .col-paid, .col-pending { display: none !important; }
      .admin-hide { display: none !important; }
    `;
    document.head.appendChild(style);

    // Update table header
    const thead = document.querySelector('table thead tr');
    if (thead) {
      thead.innerHTML = `
        <th>Student</th>
        <th>Batch</th>
        <th>Status</th>
        <th>Actions</th>
      `;
    }
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
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = Utils.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        Utils.setTheme(newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? this.icons.moon : this.icons.sun;
      });
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? this.icons.moon : this.icons.sun;
    }

    // Search
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(() => {
      this.currentPage = 1;
      this.loadEnrollments();
    }, 500));

    // Filters
    document.getElementById('statusFilter')?.addEventListener('change', () => { this.currentPage = 1; this.loadEnrollments(); });
    document.getElementById('batchFilter')?.addEventListener('change', () => { this.currentPage = 1; this.loadEnrollments(); });

    // Add enrollment button
    document.getElementById('addEnrollmentBtn')?.addEventListener('click', () => this.openAddModal());

    // Batch select change
    document.getElementById('batchSelect')?.addEventListener('change', () => this.updateFeesCalculation());
    document.getElementById('discount')?.addEventListener('input', () => this.updateFeesCalculation());

    // Status change - show/hide drop reason
    document.getElementById('enrollmentStatus')?.addEventListener('change', (e) => {
      const dropReasonGroup = document.getElementById('dropReasonGroup');
      if (dropReasonGroup) {
        dropReasonGroup.style.display = e.target.value === 'Dropped' ? 'block' : 'none';
      }
    });

    // Modal buttons
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('saveEnrollmentBtn')?.addEventListener('click', () => this.saveEnrollment());
    document.getElementById('enrollmentForm')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveEnrollment(); });

    // Close modals on overlay click
    document.getElementById('enrollmentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'enrollmentModal') this.closeModal();
    });
    document.getElementById('viewEnrollmentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewEnrollmentModal') this.closeViewModal();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  async loadStudents() {
    try {
      const response = await api.get('/students', { limit: 1000, status: 'Active' });
      if (response.success) { this.students = response.data; this.populateStudentDropdown(); }
    } catch (error) { console.error('Error loading students:', error); }
  }

  async loadBatches() {
    try {
      const response = await api.get('/batches', { limit: 1000, status: 'Running' });
      if (response.success) { this.batches = response.data; this.populateBatchDropdowns(); }
    } catch (error) { console.error('Error loading batches:', error); }
  }

  populateStudentDropdown() {
    const select = document.getElementById('studentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select Student</option>' +
      this.students.map(s => `<option value="${s._id}">${s.name} (${s.studentId || 'N/A'})</option>`).join('');
  }

  populateBatchDropdowns() {
    const batchSelect = document.getElementById('batchSelect');
    if (batchSelect) {
      batchSelect.innerHTML = '<option value="">Select Batch</option>' +
        this.batches.map(b => `<option value="${b._id}" data-fees="${b.fees}">${b.batchName} - ${b.courseName} (₹${b.fees})</option>`).join('');
    }
    const batchFilter = document.getElementById('batchFilter');
    if (batchFilter) {
      batchFilter.innerHTML = '<option value="">All Batches</option>' +
        this.batches.map(b => `<option value="${b._id}">${b.batchName}</option>`).join('');
    }
  }

  updateFeesCalculation() {
    const batchSelect = document.getElementById('batchSelect');
    const discountInput = document.getElementById('discount');
    const batchFeesDisplay = document.getElementById('batchFeesDisplay');
    const finalFeesDisplay = document.getElementById('finalFeesDisplay');
    if (!batchSelect || !batchFeesDisplay || !finalFeesDisplay) return;
    const selectedOption = batchSelect.options[batchSelect.selectedIndex];
    const batchFees = selectedOption ? parseFloat(selectedOption.dataset.fees) || 0 : 0;
    const discount = parseFloat(discountInput?.value) || 0;
    batchFeesDisplay.textContent = Utils.formatCurrency(batchFees);
    finalFeesDisplay.textContent = Utils.formatCurrency(Math.max(0, batchFees - discount));
  }

  async loadStats() {
    try {
      const response = await api.get('/enrollments', { limit: 1000 });
      if (response.success) {
        const enrollments = response.data;
        const total = response.total || enrollments.length;
        this.renderStats({
          total,
          active: enrollments.filter(e => e.status === 'Running').length,
          completed: enrollments.filter(e => e.status === 'Completed').length,
          dropped: enrollments.filter(e => e.status === 'Dropped').length
        });
      }
    } catch (error) { console.error('Error loading stats:', error); }
  }

  renderStats(stats) {
    const container = document.getElementById('enrollmentStats');
    if (!container) return;
    const accentVar = { primary: 'var(--brand-600)', success: 'var(--brand-600)', warning: 'var(--gold-600)', danger: 'var(--brick-600)', info: 'var(--slate-600)' };
    const cards = [
      { label: 'Total Enrollments', value: stats.total, icon: this.icons.total, className: 'primary' },
      { label: 'Active', value: stats.active, icon: this.icons.active, className: 'success' },
      { label: 'Completed', value: stats.completed, icon: this.icons.completed, className: 'info' },
      { label: 'Dropped', value: stats.dropped, icon: this.icons.dropped, className: 'danger' }
    ];
    container.innerHTML = cards.map(c => `
      <div class="stat-card" style="--stat-accent: ${accentVar[c.className]};">
        <div class="stat-icon ${c.className}">${c.icon}</div>
        <div class="stat-info"><h4>${c.label}</h4><p>${c.value}</p></div>
      </div>`).join('');
  }

  async loadEnrollments() {
    const tbody = document.getElementById('enrollmentsTableBody');
    if (!tbody) return;
    const colSpan = this.isSuperAdmin ? 9 : 4;
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>`;
    try {
      const params = { page: this.currentPage, limit: this.pageSize };
      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.search = search;
      const status = document.getElementById('statusFilter')?.value;
      if (status) params.status = status;
      const batchId = document.getElementById('batchFilter')?.value;
      if (batchId) params.batchId = batchId;

      const response = await api.get('/enrollments', params);
      if (response.success) {
        this.totalPages = response.pagination.totalPages;
        this.renderEnrollments(response.data);
        this.renderPagination();
      }
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-danger">Error loading enrollments</td></tr>`;
      Utils.showToast(error.message || 'Failed to load enrollments', 'error');
    }
  }

  renderEnrollments(enrollments) {
    const tbody = document.getElementById('enrollmentsTableBody');
    if (!tbody) return;
    const colSpan = this.isSuperAdmin ? 9 : 4;

    if (!enrollments || enrollments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center">No enrollments found</td></tr>`;
      return;
    }

    tbody.innerHTML = enrollments.map(enrollment => {
      const student = enrollment.studentId || {};
      const batch = enrollment.batchId || {};
      const payment = enrollment.paymentSummary || {};
      const pendingAmount = payment.pendingAmount || 0;
      const paymentStatus = pendingAmount <= 0 ? 'Paid' : payment.totalPaid > 0 ? 'Partial' : 'Unpaid';
      const statusClass = this.getStatusClass(enrollment.status);
      const paymentStatusClass = paymentStatus === 'Paid' ? 'success' : paymentStatus === 'Partial' ? 'warning' : 'danger';

      if (this.isSuperAdmin) {
        // FULL VIEW for Super Admin
        return `
          <tr>
            <td><strong>${Utils.escapeHtml(student.name || 'N/A')}</strong><br><small class="text-muted">${student.studentId || ''}</small></td>
            <td>${Utils.escapeHtml(batch.batchName || 'N/A')}</td>
            <td class="col-fees">${Utils.formatCurrency(enrollment.batchFees)}</td>
            <td class="col-discount text-success">${Utils.formatCurrency(enrollment.discount || 0)}</td>
            <td class="col-final-fees"><strong>${Utils.formatCurrency(enrollment.finalFees)}</strong></td>
            <td class="col-paid text-success">${Utils.formatCurrency(payment.totalPaid || 0)}</td>
            <td class="col-pending text-danger">${Utils.formatCurrency(pendingAmount)}</td>
            <td>
              <span class="badge badge-${statusClass}">${enrollment.status}</span>
              ${paymentStatus !== 'Paid' && enrollment.status !== 'Dropped' ? `<br><small class="badge badge-${paymentStatusClass}">${paymentStatus}</small>` : ''}
            </td>
            <td>
              <div class="btn-group" style="display:flex;gap:3px;">
                <button class="btn-icon" title="View" onclick="enrollmentsModule.viewEnrollment('${enrollment._id}')">${this.icons.view}</button>
                <button class="btn-icon" title="Edit" onclick="enrollmentsModule.openEditModal('${enrollment._id}')">${this.icons.edit}</button>
                <button class="btn-icon admin-hide" title="Delete" onclick="enrollmentsModule.deleteEnrollment('${enrollment._id}')">${this.icons.delete}</button>
              </div>
            </td>
          </tr>`;
      } else {
        // LIMITED VIEW for Admin (no financial data, no view/delete)
        return `
          <tr>
            <td><strong>${Utils.escapeHtml(student.name || 'N/A')}</strong><br><small class="text-muted">${student.studentId || ''}</small></td>
            <td>${Utils.escapeHtml(batch.batchName || 'N/A')}</td>
            <td>
              <span class="badge badge-${statusClass}">${enrollment.status}</span>
            </td>
            <td>
              <div class="btn-group" style="display:flex;gap:3px;">
                <button class="btn-icon" title="Edit" onclick="enrollmentsModule.openEditModal('${enrollment._id}')">${this.icons.edit}</button>
              </div>
            </td>
          </tr>`;
      }
    }).join('');
  }

  getStatusClass(status) {
    const map = { 'Running': 'success', 'Completed': 'primary', 'Dropped': 'danger' };
    return map[status] || 'info';
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    let html = `<button class="page-btn" ${this.currentPage===1?'disabled':''} onclick="enrollmentsModule.goToPage(${this.currentPage-1})">← Previous</button>`;
    for (let i=1; i<=this.totalPages; i++) {
      if (i===1||i===this.totalPages||(i>=this.currentPage-2&&i<=this.currentPage+2)) {
        html += `<button class="page-btn ${i===this.currentPage?'active':''}" onclick="enrollmentsModule.goToPage(${i})">${i}</button>`;
      } else if (i===this.currentPage-3||i===this.currentPage+3) {
        html += '<span class="page-dots">...</span>';
      }
    }
    html += `<button class="page-btn" ${this.currentPage===this.totalPages?'disabled':''} onclick="enrollmentsModule.goToPage(${this.currentPage+1})">Next →</button>`;
    container.innerHTML = html;
  }

  goToPage(page) { if (page<1||page>this.totalPages) return; this.currentPage = page; this.loadEnrollments(); }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'New Enrollment';
    document.getElementById('saveBtnText').textContent = 'Save Enrollment';
    document.getElementById('enrollmentForm').reset();
    document.getElementById('enrollmentId').value = '';
    document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('enrollmentStatus').value = 'Running';
    document.getElementById('discount').value = '0';
    document.getElementById('dropReasonGroup').style.display = 'none';
    
    // Hide financial fields for admin
    this.toggleFinancialFields();
    
    this.updateFeesCalculation();
    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/enrollments/${id}`);
      if (response.success) {
        const enrollment = response.data.enrollment || response.data;
        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit Enrollment';
        document.getElementById('saveBtnText').textContent = 'Update Enrollment';
        setTimeout(() => {
          document.getElementById('enrollmentId').value = enrollment._id;
          document.getElementById('studentSelect').value = enrollment.studentId?._id || enrollment.studentId || '';
          document.getElementById('batchSelect').value = enrollment.batchId?._id || enrollment.batchId || '';
          document.getElementById('discount').value = enrollment.discount || 0;
          document.getElementById('joiningDate').value = enrollment.joiningDate ? new Date(enrollment.joiningDate).toISOString().split('T')[0] : '';
          document.getElementById('enrollmentStatus').value = enrollment.status || 'Running';
          document.getElementById('dropReason').value = enrollment.dropReason || '';
          document.getElementById('remarks').value = enrollment.remarks || '';
          const dropReasonGroup = document.getElementById('dropReasonGroup');
          if (dropReasonGroup) dropReasonGroup.style.display = enrollment.status === 'Dropped' ? 'block' : 'none';
          
          // Hide financial fields for admin
          this.toggleFinancialFields();
          
          this.updateFeesCalculation();
        }, 100);
        this.hideModalError();
        this.showModal();
      }
    } catch (error) { Utils.showToast('Failed to load enrollment', 'error'); }
    finally { Utils.hideLoading(); }
  }

  toggleFinancialFields() {
    // Hide fee-related fields in modal for non-Super Admin
    const feeFields = document.querySelectorAll('#batchFeesDisplay, #discount, #finalFeesDisplay');
    const feeLabels = document.querySelectorAll('label[for="discount"]');
    
    feeFields.forEach(el => {
      const parent = el.closest('.form-group');
      if (parent) {
        parent.style.display = this.isSuperAdmin ? '' : 'none';
      }
    });
  }

  async viewEnrollment(id) {
    // Only Super Admin can view details
    if (!this.isSuperAdmin) {
      Utils.showToast('Access denied', 'warning');
      return;
    }
    try {
      Utils.showLoading();
      const response = await api.get(`/enrollments/${id}`);
      if (response.success) {
        const data = response.data;
        const enrollment = data.enrollment || data;
        const payments = data.payments || [];
        const summary = data.paymentSummary || {};
        this.viewingId = id;
        document.getElementById('enrollmentDetails').innerHTML = this.buildEnrollmentDetailsHTML(enrollment, payments, summary);
        this.showViewModal();
      }
    } catch (error) { Utils.showToast('Failed to load enrollment details', 'error'); }
    finally { Utils.hideLoading(); }
  }

  buildEnrollmentDetailsHTML(enrollment, payments, summary) {
    const student = enrollment.studentId || {};
    const batch = enrollment.batchId || {};
    const statusClass = this.getStatusClass(enrollment.status);
    const paymentStatus = summary.paymentStatus || (summary.pendingAmount <= 0 ? 'Paid' : summary.totalPaid > 0 ? 'Partial' : 'Unpaid');
    const paymentStatusClass = paymentStatus === 'Paid' ? 'success' : paymentStatus === 'Partial' ? 'warning' : 'danger';
    return `
      <div class="enrollment-profile-header">
        <div class="enrollment-header-left">
          <h2>${Utils.escapeHtml(student.name || 'N/A')}</h2>
          <p>${Utils.escapeHtml(batch.batchName || 'N/A')} - ${Utils.escapeHtml(batch.courseName || '')}</p>
          <div class="batch-badges">
            <span class="badge badge-${statusClass}">${enrollment.status}</span>
            <span class="badge badge-${paymentStatusClass}">Payment: ${paymentStatus}</span>
          </div>
        </div>
        <div class="enrollment-header-right">
          <div class="enrollment-fee">${Utils.formatCurrency(enrollment.finalFees)}</div>
          <small>Final Fees</small>
        </div>
      </div>
      <div class="info-cards-grid">
        <div class="info-card"><div class="info-card-header"><span class="info-card-icon">${this.icons.money}</span><h4>Fee Details</h4></div><div class="info-card-body">
          <div class="info-row"><span class="info-label">Batch Fees</span><span class="info-value">${Utils.formatCurrency(enrollment.batchFees)}</span></div>
          <div class="info-row"><span class="info-label">Discount</span><span class="info-value text-success">- ${Utils.formatCurrency(enrollment.discount||0)}</span></div>
          <div class="info-row" style="border-top:2px solid var(--border-color);padding-top:12px;"><span class="info-label"><strong>Final Fees</strong></span><span class="info-value"><strong>${Utils.formatCurrency(enrollment.finalFees)}</strong></span></div>
          <div class="info-row"><span class="info-label">Total Paid</span><span class="info-value text-success"><strong>${Utils.formatCurrency(summary.totalPaid||0)}</strong></span></div>
          <div class="info-row"><span class="info-label">Pending</span><span class="info-value text-danger"><strong>${Utils.formatCurrency(summary.pendingAmount||0)}</strong></span></div>
        </div></div>
        <div class="info-card"><div class="info-card-header"><span class="info-card-icon">${this.icons.info}</span><h4>Enrollment Info</h4></div><div class="info-card-body">
          <div class="info-row"><span class="info-label">Joining Date</span><span class="info-value">${Utils.formatDate(enrollment.joiningDate)}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-${statusClass}">${enrollment.status}</span></span></div>
          ${enrollment.completionDate?`<div class="info-row"><span class="info-label">Completion Date</span><span class="info-value">${Utils.formatDate(enrollment.completionDate)}</span></div>`:''}
          ${enrollment.dropDate?`<div class="info-row"><span class="info-label">Drop Date</span><span class="info-value">${Utils.formatDate(enrollment.dropDate)}</span></div>`:''}
          ${enrollment.dropReason?`<div class="info-row"><span class="info-label">Drop Reason</span><span class="info-value">${Utils.escapeHtml(enrollment.dropReason)}</span></div>`:''}
          ${enrollment.remarks?`<div class="info-row"><span class="info-label">Remarks</span><span class="info-value">${Utils.escapeHtml(enrollment.remarks)}</span></div>`:''}
        </div></div>
      </div>
      <div class="card" style="margin-top:20px;"><div class="card-header"><h3>Payment History (${payments.length} payments)</h3></div><div class="card-body">
        ${payments.length>0?`<div class="table-container"><table><thead><tr><th>Receipt No</th><th>Date</th><th>Amount</th><th>Mode</th><th>Received By</th><th>Remarks</th></tr></thead><tbody>${payments.map(p=>`<tr><td><span class="badge badge-info">${p.receiptNumber||'N/A'}</span></td><td>${Utils.formatDate(p.paymentDate)}</td><td><strong>${Utils.formatCurrency(p.amount)}</strong></td><td><span class="badge badge-primary">${p.paymentMode}</span></td><td>${p.receivedBy?.name||'N/A'}</td><td>${p.remarks||'-'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="text-center text-muted">No payments recorded yet</p>'}
      </div></div>
      <div style="margin-top:20px;padding:0 5px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><small>Payment Progress</small><small>${enrollment.finalFees>0?((summary.totalPaid/enrollment.finalFees)*100).toFixed(1):0}%</small></div>
        <div class="progress-bar" style="height:10px;"><div class="progress-fill" style="width:${enrollment.finalFees>0?((summary.totalPaid/enrollment.finalFees)*100):0}%"></div></div>
      </div>
      <div class="timestamps-info"><small>Created: ${Utils.formatDate(enrollment.createdAt,'DD/MM/YYYY HH:MM')}</small>${enrollment.updatedAt?`<small> | Updated: ${Utils.formatDate(enrollment.updatedAt,'DD/MM/YYYY HH:MM')}</small>`:''}</div>`;
  }

  async saveEnrollment() {
    const studentId = document.getElementById('studentSelect')?.value;
    const batchId = document.getElementById('batchSelect')?.value;
    const discount = document.getElementById('discount')?.value || '0';
    const joiningDate = document.getElementById('joiningDate')?.value;
    const status = document.getElementById('enrollmentStatus')?.value;
    const dropReason = document.getElementById('dropReason')?.value?.trim();
    const remarks = document.getElementById('remarks')?.value?.trim();
    if (!studentId) { this.showModalError('Please select a student'); return; }
    if (!batchId) { this.showModalError('Please select a batch'); return; }
    if (status === 'Dropped' && !dropReason) { this.showModalError('Please provide a reason for dropping'); return; }
    const data = { studentId, batchId, discount: parseFloat(discount)||0, joiningDate: joiningDate?new Date(joiningDate).toISOString():new Date().toISOString(), status, remarks: remarks||null };
    if (status === 'Dropped') data.dropReason = dropReason;
    this.setSaveLoading(true); this.hideModalError();
    try {
      const res = this.editingId ? await api.put(`/enrollments/${this.editingId}`, data) : await api.post('/enrollments', data);
      if (res.success) { this.closeModal(); Utils.showToast(this.editingId?'Enrollment updated':'Enrollment created', 'success'); await this.loadEnrollments(); await this.loadStats(); }
    } catch (e) { this.showModalError(e.message); }
    finally { this.setSaveLoading(false); }
  }

  async deleteEnrollment(id) {
    if (!this.isSuperAdmin) { Utils.showToast('Access denied', 'warning'); return; }
    if (!await Utils.confirm('Are you sure you want to delete this enrollment?')) return;
    try { await api.delete(`/enrollments/${id}`); Utils.showToast('Deleted', 'success'); await this.loadEnrollments(); await this.loadStats(); }
    catch (e) { Utils.showToast(e.message, 'error'); }
  }

  showModal() { document.getElementById('enrollmentModal').style.display = 'flex'; }
  closeModal() { document.getElementById('enrollmentModal').style.display = 'none'; this.editingId = null; }
  showViewModal() { document.getElementById('viewEnrollmentModal').style.display = 'flex'; }
  closeViewModal() { document.getElementById('viewEnrollmentModal').style.display = 'none'; this.viewingId = null; }
  showModalError(m) { const d=document.getElementById('modalError'); if(d){d.style.display='block';d.querySelector('.alert').textContent=m;} }
  hideModalError() { const d=document.getElementById('modalError'); if(d)d.style.display='none'; }
  setSaveLoading(l) { const b=document.getElementById('saveEnrollmentBtn'),t=document.getElementById('saveBtnText'),s=document.getElementById('saveSpinner'); if(b)b.disabled=l; if(t)t.style.display=l?'none':'inline'; if(s)s.style.display=l?'inline-block':'none'; }
}

let enrollmentsModule;
document.addEventListener('DOMContentLoaded', () => { enrollmentsModule = new Enrollments(); });