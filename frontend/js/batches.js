// Batches Module
const BATCH_ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5"/><path d="M8.5 11l2 2 4-4.5M8.5 16.5h7"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.5c0-.8.7-1.5 1.5-1.5h7L19 7.5v12c0 .8-.7 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Z"/><path d="M13 3v4.5H19"/><path d="M8.5 12h7M8.5 15.5h5"/></svg>',
  teacher: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="13" height="13" style="vertical-align:-2px;"><circle cx="12" cy="7.5" r="3"/><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>'
};

class Batches {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.viewingBatchId = null;

    this.init();
  }

  async init() {
    // Check authentication
    if (!auth.isAuthenticated()) {
      return;
    }

    // Update user info in sidebar
    this.updateSidebar();

    // Setup event listeners
    this.setupEventListeners();

    // Load batches
    await this.loadBatches();
    await this.loadBatchStats();
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
        themeToggle.innerHTML = newTheme === 'light' ? BATCH_ICONS.moon : BATCH_ICONS.sun;
      });
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? BATCH_ICONS.moon : BATCH_ICONS.sun;
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        this.currentPage = 1;
        this.loadBatches();
      }, 500));
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.loadBatches();
      });
    }

    // Add batch button
    document.getElementById('addBatchBtn')?.addEventListener('click', () => this.openAddModal());

    // Modal close buttons
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());

    // Save batch
    document.getElementById('saveBatchBtn')?.addEventListener('click', () => this.saveBatch());

    // Form submission
    document.getElementById('batchForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBatch();
    });

    // Close modals on overlay click
    document.getElementById('batchModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'batchModal') this.closeModal();
    });
    document.getElementById('viewBatchModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewBatchModal') this.closeViewModal();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  async loadBatchStats() {
    try {
      // Get all batches for stats (without pagination)
      const response = await api.get('/batches', { limit: 100 });

      if (response.success) {
        const batches = response.data;
        const total = response.total || batches.length;

        const running = batches.filter(b => b.status === 'Running').length;
        const completed = batches.filter(b => b.status === 'Completed').length;
        const upcoming = batches.filter(b => b.status === 'Upcoming').length;

        document.getElementById('totalBatches').textContent = total;
        document.getElementById('runningBatches').textContent = running;
        document.getElementById('completedBatches').textContent = completed;
        document.getElementById('upcomingBatches').textContent = upcoming;
      }
    } catch (error) {
      console.error('Error loading batch stats:', error);
    }
  }

  async loadBatches() {
    const tbody = document.getElementById('batchesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      };

      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.search = search;

      const status = document.getElementById('statusFilter')?.value;
      if (status) params.status = status;

      const response = await api.get('/batches', params);

      if (response.success) {
        this.totalPages = response.pagination.totalPages;
        this.renderBatches(response.data);
        this.renderPagination();
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading batches. Please try again.</td></tr>';
      Utils.showToast(error.message || 'Failed to load batches', 'error');
    }
  }

  renderBatches(batches) {
    const tbody = document.getElementById('batchesTableBody');
    if (!tbody) return;

    if (!batches || batches.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No batches found</td></tr>';
      return;
    }

    tbody.innerHTML = batches.map(batch => {
      const statusClass = this.getStatusClass(batch.status);
      const enrolledCount = batch.enrolledStudents || 0;

      return `
        <tr>
          <td>
            <strong>${Utils.escapeHtml(batch.batchName)}</strong>
          </td>
          <td>${Utils.escapeHtml(batch.courseName || 'N/A')}</td>
          <td>
            <strong>${Utils.formatCurrency(batch.fees)}</strong>
          </td>
          <td>${batch.duration || 'N/A'}</td>
          <td>${batch.timing || 'N/A'}</td>
          <td>
            <span class="badge badge-info">${enrolledCount} student${enrolledCount !== 1 ? 's' : ''}</span>
          </td>
          <td>
            <span class="badge badge-${statusClass}">${batch.status}</span>
          </td>
          <td>
            <div class="btn-group" style="display: flex; gap: 6px;">
              <button class="btn-icon" title="View Details" onclick="batchesModule.viewBatch('${batch._id}')">${BATCH_ICONS.view}</button>
              <button class="btn-icon" title="Edit" onclick="batchesModule.openEditModal('${batch._id}')">${BATCH_ICONS.edit}</button>
              <button class="btn-icon" title="Delete" onclick="batchesModule.deleteBatch('${batch._id}')">${BATCH_ICONS.delete}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  getStatusClass(status) {
    const statusMap = {
      'Running': 'success',
      'Completed': 'primary',
      'Upcoming': 'warning',
      'Cancelled': 'danger'
    };
    return statusMap[status] || 'info';
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';

    html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''}
             onclick="batchesModule.goToPage(${this.currentPage - 1})">← Previous</button>`;

    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                 onclick="batchesModule.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }

    html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}
             onclick="batchesModule.goToPage(${this.currentPage + 1})">Next →</button>`;

    container.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadBatches();
  }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Batch';
    document.getElementById('saveBtnText').textContent = 'Save Batch';

    // Clear form
    document.getElementById('batchForm').reset();
    document.getElementById('batchId').value = '';

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    document.getElementById('batchStatus').value = 'Upcoming';

    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/batches/${id}`);

      if (response.success) {
        const batch = response.data.batch || response.data;

        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit Batch';
        document.getElementById('saveBtnText').textContent = 'Update Batch';

        // Fill form
        setTimeout(() => {
          document.getElementById('batchId').value = batch._id;
          document.getElementById('batchName').value = batch.batchName || '';
          document.getElementById('courseName').value = batch.courseName || '';
          document.getElementById('fees').value = batch.fees || '';
          document.getElementById('duration').value = batch.duration || '';
          document.getElementById('startDate').value = batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '';
          document.getElementById('endDate').value = batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '';
          document.getElementById('timing').value = batch.timing || '';
          document.getElementById('faculty').value = batch.faculty || '';
          document.getElementById('maxStudents').value = batch.maxStudents || '';
          document.getElementById('roomNumber').value = batch.roomNumber || '';
          document.getElementById('batchStatus').value = batch.status || 'Upcoming';
          document.getElementById('description').value = batch.description || '';
        }, 100);

        this.hideModalError();
        this.showModal();
      }
    } catch (error) {
      console.error('Error loading batch:', error);
      Utils.showToast('Failed to load batch details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  async viewBatch(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/batches/${id}`);

      if (response.success) {
        const data = response.data;
        const batch = data.batch || data;
        const stats = data.stats || {};

        this.viewingBatchId = id;

        const detailsContainer = document.getElementById('batchDetails');
        detailsContainer.innerHTML = this.buildBatchDetailsHTML(batch, stats);

        this.showViewModal();

        // Load students for this batch
        this.loadBatchStudents(id);
      }
    } catch (error) {
      console.error('Error viewing batch:', error);
      Utils.showToast('Failed to load batch details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  buildBatchDetailsHTML(batch, stats) {
    const statusClass = this.getStatusClass(batch.status);

    return `
      <!-- Batch Header -->
      <div class="batch-profile-header">
        <div class="batch-header-left">
          <h2>${Utils.escapeHtml(batch.batchName)}</h2>
          <p class="course-name">${Utils.escapeHtml(batch.courseName || '')}</p>
          <div class="batch-badges">
            <span class="badge badge-${statusClass}">${batch.status}</span>
            ${batch.faculty ? `<span class="badge badge-info">${BATCH_ICONS.teacher} ${Utils.escapeHtml(batch.faculty)}</span>` : ''}
          </div>
        </div>
        <div class="batch-header-right">
          <div class="batch-fee">${Utils.formatCurrency(batch.fees)}</div>
          <small>per student</small>
        </div>
      </div>

      <!-- Batch Info Cards -->
      <div class="info-cards-grid">
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${BATCH_ICONS.clipboard}</span>
            <h4>Batch Information</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">Duration</span>
              <span class="info-value">${batch.duration || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timing</span>
              <span class="info-value">${batch.timing || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Start Date</span>
              <span class="info-value">${Utils.formatDate(batch.startDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">End Date</span>
              <span class="info-value">${Utils.formatDate(batch.endDate)}</span>
            </div>
            ${batch.roomNumber ? `
            <div class="info-row">
              <span class="info-label">Room</span>
              <span class="info-value">${Utils.escapeHtml(batch.roomNumber)}</span>
            </div>` : ''}
            ${batch.maxStudents ? `
            <div class="info-row">
              <span class="info-label">Capacity</span>
              <span class="info-value">${batch.maxStudents} students</span>
            </div>` : ''}
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${BATCH_ICONS.chart}</span>
            <h4>Statistics</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">Total Students</span>
              <span class="info-value">${stats.enrolledStudents || 0}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Active</span>
              <span class="info-value text-success">${stats.activeEnrollments || 0}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Completed</span>
              <span class="info-value">${stats.completedEnrollments || 0}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dropped</span>
              <span class="info-value text-danger">${stats.droppedEnrollments || 0}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Revenue</span>
              <span class="info-value"><strong>${Utils.formatCurrency(stats.totalRevenue || 0)}</strong></span>
            </div>
          </div>
        </div>

        ${batch.description ? `
        <div class="info-card" style="grid-column: 1 / -1;">
          <div class="info-card-header">
            <span class="info-card-icon">${BATCH_ICONS.notes}</span>
            <h4>Description</h4>
          </div>
          <div class="info-card-body">
            <p class="notes-text">${Utils.escapeHtml(batch.description)}</p>
          </div>
        </div>` : ''}
      </div>

      <!-- Students List -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Enrolled Students</h3>
          <span class="badge badge-info" id="studentCount">Loading...</span>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Fees</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="batchStudentsTable">
                <tr>
                  <td colspan="7" class="text-center">Loading students...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Timestamps -->
      <div class="timestamps-info">
        <small>Created: ${Utils.formatDate(batch.createdAt, 'DD/MM/YYYY HH:MM')}</small>
        ${batch.updatedAt ? `<small> | Updated: ${Utils.formatDate(batch.updatedAt, 'DD/MM/YYYY HH:MM')}</small>` : ''}
      </div>
    `;
  }

  async loadBatchStudents(batchId) {
    try {
      const response = await api.get(`/batches/${batchId}/students`);

      if (response.success) {
        const students = response.data;
        document.getElementById('studentCount').textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;
        this.renderBatchStudents(students);
      }
    } catch (error) {
      console.error('Error loading batch students:', error);
      document.getElementById('batchStudentsTable').innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Failed to load students</td></tr>';
    }
  }

  renderBatchStudents(students) {
    const tbody = document.getElementById('batchStudentsTable');
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students enrolled</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(item => {
      const student = item.student || {};
      const summary = item.paymentSummary || {};
      const pendingAmount = summary.pendingAmount || 0;
      const paymentStatus = pendingAmount <= 0 ? 'Paid' : summary.totalPaid > 0 ? 'Partial' : 'Unpaid';
      const statusClass = paymentStatus === 'Paid' ? 'success' : paymentStatus === 'Partial' ? 'warning' : 'danger';

      return `
        <tr>
          <td>
            <span class="badge badge-primary">${student.studentId || 'N/A'}</span>
          </td>
          <td>
            <strong>${Utils.escapeHtml(student.name || 'N/A')}</strong>
          </td>
          <td>${student.mobile || 'N/A'}</td>
          <td>${Utils.formatCurrency(summary.finalFees || 0)}</td>
          <td class="text-success">${Utils.formatCurrency(summary.totalPaid || 0)}</td>
          <td class="text-danger">${Utils.formatCurrency(pendingAmount)}</td>
          <td>
            <span class="badge badge-${statusClass}">${paymentStatus}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  async saveBatch() {
    const batchName = document.getElementById('batchName')?.value?.trim();
    const courseName = document.getElementById('courseName')?.value?.trim();
    const fees = document.getElementById('fees')?.value;
    const duration = document.getElementById('duration')?.value?.trim();
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const timing = document.getElementById('timing')?.value?.trim();
    const faculty = document.getElementById('faculty')?.value?.trim();
    const maxStudents = document.getElementById('maxStudents')?.value;
    const roomNumber = document.getElementById('roomNumber')?.value?.trim();
    const status = document.getElementById('batchStatus')?.value;
    const description = document.getElementById('description')?.value?.trim();

    // Validation
    if (!batchName) {
      this.showModalError('Please enter batch name');
      return;
    }
    if (!courseName) {
      this.showModalError('Please enter course name');
      return;
    }
    if (!fees || parseFloat(fees) < 0) {
      this.showModalError('Please enter valid fees');
      return;
    }
    if (!duration) {
      this.showModalError('Please enter duration');
      return;
    }
    if (!startDate) {
      this.showModalError('Please select start date');
      return;
    }
    if (!endDate) {
      this.showModalError('Please select end date');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      this.showModalError('End date must be after start date');
      return;
    }
    if (!timing) {
      this.showModalError('Please enter timing');
      return;
    }

    const data = {
      batchName,
      courseName,
      fees: parseFloat(fees),
      duration,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      timing,
      faculty: faculty || null,
      maxStudents: maxStudents ? parseInt(maxStudents) : null,
      roomNumber: roomNumber || null,
      status: status || 'Upcoming',
      description: description || null
    };

    this.setSaveLoading(true);
    this.hideModalError();

    try {
      let response;
      if (this.editingId) {
        response = await api.put(`/batches/${this.editingId}`, data);
      } else {
        response = await api.post('/batches', data);
      }

      if (response.success) {
        this.closeModal();
        Utils.showToast(
          this.editingId ? 'Batch updated successfully' : 'Batch created successfully',
          'success'
        );
        await this.loadBatches();
        await this.loadBatchStats();
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showModalError(error.message || 'Failed to save batch');
    } finally {
      this.setSaveLoading(false);
    }
  }

  async deleteBatch(id) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this batch? This will also delete all associated enrollments and payments.');

    if (confirmed) {
      try {
        const response = await api.delete(`/batches/${id}`);

        if (response.success) {
          Utils.showToast('Batch deleted successfully', 'success');
          await this.loadBatches();
          await this.loadBatchStats();
        }
      } catch (error) {
        Utils.showToast(error.message || 'Failed to delete batch', 'error');
      }
    }
  }

  showModal() {
    document.getElementById('batchModal').style.display = 'flex';
  }

  closeModal() {
    document.getElementById('batchModal').style.display = 'none';
    this.editingId = null;
  }

  showViewModal() {
    document.getElementById('viewBatchModal').style.display = 'flex';
  }

  closeViewModal() {
    document.getElementById('viewBatchModal').style.display = 'none';
    this.viewingBatchId = null;
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
    const btn = document.getElementById('saveBatchBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveSpinner');

    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

// Initialize when DOM is loaded
let batchesModule;
document.addEventListener('DOMContentLoaded', () => {
  batchesModule = new Batches();
});