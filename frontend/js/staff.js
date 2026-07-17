// Staff Module (Super Admin only)
// NOTE: uses direct fetch()+FormData for create/update since photo upload is multipart.
// Keep API_BASE in sync with config.js if your API base URL differs.
const STAFF_API_BASE = 'http://localhost:5000/api';

const STAFF_ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.36-6.5 7.5-6.5s7.5 2.9 7.5 6.5"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7.5" width="18" height="12" rx="1.5"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3 12.5h18"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="5.5"/><circle cx="15" cy="15" r="5.5"/></svg>'
};

class StaffModule {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) { window.location.href = 'login.html'; return; }
    if (auth.currentUser?.role !== 'Super Admin') { window.location.href = 'students.html'; return; }

    this.updateSidebar();
    this.setupEventListeners();
    await this.loadStats();
    await this.loadStaff();
  }

  updateSidebar() {
    const user = auth.currentUser;
    if (!user) return;
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    if (userAvatar) userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role;
  }

  setupEventListeners() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = Utils.getTheme() === 'light' ? 'dark' : 'light';
        Utils.setTheme(newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? STAFF_ICONS.moon : STAFF_ICONS.sun;
      });
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? STAFF_ICONS.moon : STAFF_ICONS.sun;
    }

    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(() => {
      this.currentPage = 1;
      this.loadStaff();
    }, 500));

    document.getElementById('designationFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadStaff();
    });

    document.getElementById('statusFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadStaff();
    });

    document.getElementById('addStaffBtn')?.addEventListener('click', () => this.openAddModal());

    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('saveStaffBtn')?.addEventListener('click', () => this.saveStaff());

    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'staffModal') this.closeModal();
    });
    document.getElementById('viewStaffModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewStaffModal') this.closeViewModal();
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  }

  async apiFetch(url, options = {}) {
    const res = await fetch(`${STAFF_API_BASE}${url}`, { ...options, headers: { ...this.authHeaders(), ...(options.headers || {}) } });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async loadStats() {
    try {
      const res = await this.apiFetch('/staff/stats/summary');
      const d = res.data;
      document.getElementById('statTotal').textContent = d.total;
      document.getElementById('statActive').textContent = d.active;
      document.getElementById('statOnLeave').textContent = d.onLeave;
      document.getElementById('statInactive').textContent = d.inactive;
    } catch (e) { console.error('Error loading staff stats:', e); }
  }

  async loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = new URLSearchParams({ page: this.currentPage, limit: this.pageSize });
      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.set('search', search);
      const designation = document.getElementById('designationFilter')?.value;
      if (designation) params.set('designation', designation);
      const status = document.getElementById('statusFilter')?.value;
      if (status) params.set('status', status);

      const res = await this.apiFetch(`/staff?${params.toString()}`);
      this.totalPages = res.pagination?.totalPages || 1;
      this.renderStaff(res.data);
      this.renderPagination();
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading staff</td></tr>';
      Utils.showToast(e.message || 'Failed to load staff', 'error');
    }
  }

  renderStaff(staffList) {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    if (!staffList || staffList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No staff found</td></tr>';
      return;
    }

    const statusClass = (s) => s === 'Active' ? 'success' : s === 'On Leave' ? 'warning' : 'danger';

    tbody.innerHTML = staffList.map(s => `
      <tr>
        <td><span class="badge badge-primary">${s.staffId || 'N/A'}</span></td>
        <td>
          <div class="staff-name-cell">
            <div class="staff-avatar-sm">${s.photo ? `<img src="${s.photo}" alt="${Utils.escapeHtml(s.name)}">` : s.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
            <strong>${Utils.escapeHtml(s.name)}</strong>
          </div>
        </td>
        <td>${s.designation}</td>
        <td>${s.mobile}</td>
        <td>${s.course ? Utils.escapeHtml(s.course) : '<span class="text-muted">-</span>'}</td>
        <td>${s.salary ? Utils.formatCurrency(s.salary) : '<span class="text-muted">-</span>'}</td>
        <td><span class="badge badge-${statusClass(s.status)}">${s.status}</span></td>
        <td>
          <div class="btn-group" style="display: flex; gap: 6px;">
            <button class="btn-icon" title="View" onclick="staffModule.viewStaff('${s._id}')">${STAFF_ICONS.view}</button>
            <button class="btn-icon" title="Edit" onclick="staffModule.openEditModal('${s._id}')">${STAFF_ICONS.edit}</button>
            <button class="btn-icon" title="Delete" onclick="staffModule.deleteStaff('${s._id}')">${STAFF_ICONS.delete}</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    let html = `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="staffModule.goToPage(${this.currentPage - 1})">← Previous</button>`;
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="staffModule.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }
    html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="staffModule.goToPage(${this.currentPage + 1})">Next →</button>`;
    container.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadStaff();
  }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Staff';
    document.getElementById('saveBtnText').textContent = 'Save Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('staffRecordId').value = '';
    document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('status').value = 'Active';
    document.getElementById('existingPhotoNote').style.display = 'none';
    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const res = await this.apiFetch(`/staff/${id}`);
      const s = res.data.staff;

      this.editingId = id;
      document.getElementById('modalTitle').textContent = 'Edit Staff';
      document.getElementById('saveBtnText').textContent = 'Update Staff';

      document.getElementById('staffRecordId').value = s._id;
      document.getElementById('name').value = s.name || '';
      document.getElementById('mobile').value = s.mobile || '';
      document.getElementById('alternateMobile').value = s.alternateMobile || '';
      document.getElementById('email').value = s.email || '';
      document.getElementById('designation').value = s.designation || '';
      document.getElementById('course').value = s.course || '';
      document.getElementById('salary').value = s.salary || '';
      document.getElementById('joiningDate').value = s.joiningDate ? new Date(s.joiningDate).toISOString().split('T')[0] : '';
      document.getElementById('gender').value = s.gender || '';
      document.getElementById('dateOfBirth').value = s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '';
      document.getElementById('aadharNumber').value = s.aadharNumber || '';
      document.getElementById('status').value = s.status || 'Active';
      document.getElementById('address').value = s.address || '';
      document.getElementById('notes').value = s.notes || '';
      document.getElementById('photo').value = '';
      document.getElementById('existingPhotoNote').style.display = s.photo ? 'block' : 'none';

      this.hideModalError();
      this.showModal();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to load staff details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  async viewStaff(id) {
    try {
      Utils.showLoading();
      const res = await this.apiFetch(`/staff/${id}`);
      const { staff, recentSalaries } = res.data;
      document.getElementById('staffDetails').innerHTML = this.buildStaffDetailsHTML(staff, recentSalaries);
      this.showViewModal();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to load staff details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  buildStaffDetailsHTML(s, recentSalaries) {
    const statusClass = s.status === 'Active' ? 'success' : s.status === 'On Leave' ? 'warning' : 'danger';

    return `
      <div class="student-profile-header">
        <div class="student-avatar-large">
          ${s.photo ? `<img src="${s.photo}" alt="${Utils.escapeHtml(s.name)}">` : s.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div class="student-header-info">
          <h2>${Utils.escapeHtml(s.name)}</h2>
          <span class="badge badge-${statusClass}">${s.status}</span>
          <span class="student-id-badge">${s.staffId || 'N/A'}</span>
        </div>
      </div>

      <div class="info-cards-grid">
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${STAFF_ICONS.person}</span>
            <h4>Personal Information</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Mobile</span><span class="info-value"><a href="tel:${s.mobile}">${s.mobile}</a></span></div>
            ${s.alternateMobile ? `<div class="info-row"><span class="info-label">Alternate Mobile</span><span class="info-value"><a href="tel:${s.alternateMobile}">${s.alternateMobile}</a></span></div>` : ''}
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${s.email ? `<a href="mailto:${s.email}">${s.email}</a>` : 'N/A'}</span></div>
            ${s.gender ? `<div class="info-row"><span class="info-label">Gender</span><span class="info-value">${s.gender}</span></div>` : ''}
            ${s.dateOfBirth ? `<div class="info-row"><span class="info-label">Date of Birth</span><span class="info-value">${Utils.formatDate(s.dateOfBirth)}</span></div>` : ''}
            ${s.aadharNumber ? `<div class="info-row"><span class="info-label">Aadhar Number</span><span class="info-value">${Utils.escapeHtml(s.aadharNumber)}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Address</span><span class="info-value">${s.address ? Utils.escapeHtml(s.address) : 'N/A'}</span></div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${STAFF_ICONS.briefcase}</span>
            <h4>Employment Information</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Designation</span><span class="info-value">${s.designation}</span></div>
            ${s.course ? `<div class="info-row"><span class="info-label">Course / Subject</span><span class="info-value">${Utils.escapeHtml(s.course)}</span></div>` : ''}
            ${s.salary ? `<div class="info-row"><span class="info-label">Salary</span><span class="info-value"><strong>${Utils.formatCurrency(s.salary)}</strong></span></div>` : ''}
            <div class="info-row"><span class="info-label">Joining Date</span><span class="info-value">${Utils.formatDate(s.joiningDate)}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-${statusClass}">${s.status}</span></span></div>
          </div>
        </div>

        ${s.notes ? `
        <div class="info-card" style="grid-column: 1 / -1;">
          <div class="info-card-header">
            <span class="info-card-icon">${STAFF_ICONS.person}</span>
            <h4>Notes</h4>
          </div>
          <div class="info-card-body"><p class="notes-text">${Utils.escapeHtml(s.notes)}</p></div>
        </div>` : ''}
      </div>

      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Recent Salary Payments</h3>
          <span class="info-card-icon">${STAFF_ICONS.coins}</span>
        </div>
        <div class="card-body">
          ${recentSalaries && recentSalaries.length > 0 ? `
            <div class="table-container">
              <table>
                <thead><tr><th>Date</th><th>Amount</th><th>Payment Mode</th><th>Remarks</th></tr></thead>
                <tbody>
                  ${recentSalaries.map(p => `
                    <tr>
                      <td>${Utils.formatDate(p.expenseDate)}</td>
                      <td><strong>${Utils.formatCurrency(p.amount)}</strong></td>
                      <td><span class="badge badge-info">${p.paymentMode}</span></td>
                      <td>${p.remarks || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p class="text-center text-muted">No salary payments recorded yet</p>'}
        </div>
      </div>

      <div class="timestamps-info">
        <small>Created: ${Utils.formatDate(s.createdAt, 'DD/MM/YYYY HH:MM')}</small>
        ${s.updatedAt ? `<small> | Updated: ${Utils.formatDate(s.updatedAt, 'DD/MM/YYYY HH:MM')}</small>` : ''}
      </div>
    `;
  }

  async saveStaff() {
    const name = document.getElementById('name')?.value?.trim();
    const mobile = document.getElementById('mobile')?.value?.trim();
    const designation = document.getElementById('designation')?.value;
    const joiningDate = document.getElementById('joiningDate')?.value;
    const aadharNumber = document.getElementById('aadharNumber')?.value?.trim();

    if (!name) { this.showModalError('Please enter staff name'); return; }
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) { this.showModalError('Please enter a valid 10-digit mobile number'); return; }
    if (!designation) { this.showModalError('Please select a designation'); return; }
    if (!joiningDate) { this.showModalError('Please select joining date'); return; }
    if (aadharNumber && !/^[0-9]{12}$/.test(aadharNumber)) { this.showModalError('Please enter a valid 12-digit Aadhar number'); return; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('designation', designation);
    formData.append('joiningDate', joiningDate);

    const fields = ['alternateMobile', 'email', 'course', 'salary', 'gender', 'dateOfBirth', 'aadharNumber', 'status', 'address', 'notes'];
    fields.forEach(id => {
      const val = document.getElementById(id)?.value?.trim();
      if (val) formData.append(id, val);
    });

    const fileInput = document.getElementById('photo');
    if (fileInput?.files?.[0]) {
      formData.append('photo', fileInput.files[0]);
    }

    this.setSaveLoading(true);
    this.hideModalError();

    try {
      const url = this.editingId ? `/staff/${this.editingId}` : '/staff';
      const method = this.editingId ? 'PUT' : 'POST';
      await this.apiFetch(url, { method, body: formData });

      this.closeModal();
      Utils.showToast(this.editingId ? 'Staff updated successfully' : 'Staff created successfully', 'success');
      await this.loadStaff();
      await this.loadStats();
    } catch (e) {
      this.showModalError(e.message || 'Failed to save staff');
    } finally {
      this.setSaveLoading(false);
    }
  }

  async deleteStaff(id) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this staff member?');
    if (!confirmed) return;
    try {
      await this.apiFetch(`/staff/${id}`, { method: 'DELETE' });
      Utils.showToast('Staff deleted successfully', 'success');
      await this.loadStaff();
      await this.loadStats();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to delete staff', 'error');
    }
  }

  showModal() { document.getElementById('staffModal').style.display = 'flex'; }
  closeModal() { document.getElementById('staffModal').style.display = 'none'; this.editingId = null; }
  showViewModal() { document.getElementById('viewStaffModal').style.display = 'flex'; }
  closeViewModal() { document.getElementById('viewStaffModal').style.display = 'none'; }

  showModalError(message) {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.querySelector('.alert').textContent = message; }
  }
  hideModalError() {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) errorDiv.style.display = 'none';
  }
  setSaveLoading(isLoading) {
    const btn = document.getElementById('saveStaffBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveSpinner');
    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

let staffModule;
document.addEventListener('DOMContentLoaded', () => {
  staffModule = new StaffModule();
});