// Users Module
class Users {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;

    this.icons = {
      view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>',
      edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L19.5 8.5a2.12 2.12 0 0 0-3-3L5.5 16l-1.5 4Z" stroke-linejoin="round"/><path d="M14 5.5l4.5 4.5"/></svg>',
      delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M18 7l-.8 12.2A1.8 1.8 0 0 1 15.4 21H8.6a1.8 1.8 0 0 1-1.8-1.8L6 7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke-linecap="round"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10.5" width="14" height="10" rx="1.75"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" stroke-linecap="round"/></svg>',
      unlock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10.5" width="14" height="10" rx="1.75"/><path d="M8 10.5V7a4 4 0 0 1 7.5-1.9" stroke-linecap="round"/></svg>',
      key: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16.5 6l2 2M13.5 9l2 2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>'
    };

    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) { window.location.href = 'login.html'; return; }
    if (!auth.isSuperAdmin()) {
      Utils.showToast('Access denied. Super Admin only.', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 2000);
      return;
    }
    this.updateSidebar();
    this.setupEventListeners();
    await this.loadUsers();
  }

  updateSidebar() {
    const user = auth.currentUser;
    if (!user) return;
    document.getElementById('userAvatar').textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
  }

  setupEventListeners() {
    document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('open'));

    const tt = document.getElementById('themeToggle');
    if (tt) {
      tt.addEventListener('click', () => {
        const t = Utils.getTheme() === 'light' ? 'dark' : 'light';
        Utils.setTheme(t);
        tt.innerHTML = t === 'light' ? this.icons.moon : this.icons.sun;
      });
      tt.innerHTML = Utils.getTheme() === 'light' ? this.icons.moon : this.icons.sun;
    }

    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(() => { this.currentPage = 1; this.loadUsers(); }, 500));
    document.getElementById('roleFilter')?.addEventListener('change', () => { this.currentPage = 1; this.loadUsers(); });
    document.getElementById('statusFilter')?.addEventListener('change', () => { this.currentPage = 1; this.loadUsers(); });
    document.getElementById('addUserBtn')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('saveUserBtn')?.addEventListener('click', () => this.saveUser());
    document.getElementById('userForm')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveUser(); });
    document.getElementById('userModal')?.addEventListener('click', (e) => { if (e.target.id === 'userModal') this.closeModal(); });
    document.getElementById('viewUserModal')?.addEventListener('click', (e) => { if (e.target.id === 'viewUserModal') this.closeViewModal(); });
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  async loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';
    try {
      const params = { page: this.currentPage, limit: this.pageSize, sort: '-createdAt' };
      const search = document.getElementById('searchInput')?.value?.trim();
      if (search) params.search = search;
      const role = document.getElementById('roleFilter')?.value;
      if (role) params.role = role;
      const status = document.getElementById('statusFilter')?.value;
      if (status) params.status = status;

      const response = await api.get('/users', params);
      if (response.success) {
        this.totalPages = response.pagination?.totalPages || 1;
        this.renderUsers(response.data);
        this.renderPagination();
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: ' + error.message + '</td></tr>';
      Utils.showToast(error.message, 'error');
    }
  }

  renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (!users || users.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>'; return; }
    const cuid = auth.currentUser?._id;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px;"><div class="user-avatar-circle" style="background:${u.role==='Super Admin'?'var(--primary)':'var(--info)'}">${u.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</div><strong>${Utils.escapeHtml(u.name)}</strong></div></td>
        <td>${u.email}</td><td>${u.mobile||'N/A'}</td>
        <td><span class="badge ${u.role==='Super Admin'?'badge-primary':'badge-info'}">${u.role}</span></td>
        <td><span class="badge ${u.status==='Active'?'badge-success':'badge-danger'}">${u.status}</span></td>
        <td>${u.lastLogin?Utils.formatDate(u.lastLogin,'DD/MM/YYYY HH:MM'):'Never'}</td>
        <td><div class="btn-group" style="display:flex;gap:4px;">
          <button class="btn-icon" title="View" onclick="usersModule.viewUser('${u._id}')">${this.icons.view}</button>
          <button class="btn-icon" title="Edit" onclick="usersModule.openEditModal('${u._id}')">${this.icons.edit}</button>
          ${u._id!==cuid?`
            <button class="btn-icon" title="${u.status==='Active'?'Deactivate':'Activate'}" onclick="usersModule.toggleStatus('${u._id}','${u.status}')">${u.status==='Active'?this.icons.lock:this.icons.unlock}</button>
            <button class="btn-icon" title="Reset Password" onclick="usersModule.resetPassword('${u._id}')">${this.icons.key}</button>
            <button class="btn-icon" title="Delete" onclick="usersModule.deleteUser('${u._id}')">${this.icons.delete}</button>
          `:'<small class="text-muted">You</small>'}
        </div></td>
      </tr>`).join('');
  }

  renderPagination() {
    const c = document.getElementById('pagination');
    if (!c || this.totalPages <= 1) { if(c) c.innerHTML = ''; return; }
    let h = `<button class="page-btn" ${this.currentPage===1?'disabled':''} onclick="usersModule.goToPage(${this.currentPage-1})">←</button>`;
    for (let i=1; i<=this.totalPages; i++) {
      if (i===1||i===this.totalPages||(i>=this.currentPage-2&&i<=this.currentPage+2)) h += `<button class="page-btn ${i===this.currentPage?'active':''}" onclick="usersModule.goToPage(${i})">${i}</button>`;
      else if (i===this.currentPage-3||i===this.currentPage+3) h += '<span class="page-dots">...</span>';
    }
    h += `<button class="page-btn" ${this.currentPage===this.totalPages?'disabled':''} onclick="usersModule.goToPage(${this.currentPage+1})">→</button>`;
    c.innerHTML = h;
  }

  goToPage(p) { if(p<1||p>this.totalPages) return; this.currentPage = p; this.loadUsers(); }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('saveBtnText').textContent = 'Create User';
    // Use safe setter
    this.setFieldValue('userId', '');
    this.setFieldValue('fUserName', '');
    this.setFieldValue('fUserEmail', '');
    this.setFieldValue('fUserMobile', '');
    this.setFieldValue('fUserPassword', '');
    this.setFieldValue('fUserRole', 'Admin');
    this.setFieldValue('fUserStatus', 'Active');
    const pwRow = document.getElementById('passwordRow');
    if (pwRow) pwRow.style.display = '';
    const pwField = document.getElementById('fUserPassword');
    if (pwField) pwField.required = true;
    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/users/${id}`);
      if (response.success) {
        const user = response.data;
        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('saveBtnText').textContent = 'Update User';

        // Use safe setter for all fields
        this.setFieldValue('userId', user._id);
        this.setFieldValue('fUserName', user.name || '');
        this.setFieldValue('fUserEmail', user.email || '');
        this.setFieldValue('fUserMobile', user.mobile || '');
        this.setFieldValue('fUserPassword', '');
        this.setFieldValue('fUserRole', user.role || 'Admin');
        this.setFieldValue('fUserStatus', user.status || 'Active');

        const pwField = document.getElementById('fUserPassword');
        if (pwField) pwField.required = false;

        this.hideModalError();
        this.showModal();
      }
    } catch (error) {
      Utils.showToast('Failed to load user', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  // Safe setter - only sets value if element exists
  setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
    } else {
      console.warn('Element not found:', id);
    }
  }

  // Safe getter - returns empty string if element doesn't exist
  getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value?.trim() || '' : '';
  }

  async viewUser(id) {
    try {
      Utils.showLoading();
      const res = await api.get(`/users/${id}`);
      if (res.success) {
        const u = res.data;
        document.getElementById('userDetails').innerHTML = `
          <div class="user-profile-header">
            <div class="user-avatar-large" style="background:${u.role==='Super Admin'?'var(--primary)':'var(--info)'}">${u.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</div>
            <div><h3>${Utils.escapeHtml(u.name)}</h3>
              <span class="badge ${u.role==='Super Admin'?'badge-primary':'badge-info'}">${u.role}</span>
              <span class="badge ${u.status==='Active'?'badge-success':'badge-danger'}">${u.status}</span></div>
          </div>
          <div style="display:grid;gap:12px;">
            <div class="info-row"><span class="info-label">Email</span><span>${u.email}</span></div>
            <div class="info-row"><span class="info-label">Mobile</span><span>${u.mobile||'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Last Login</span><span>${u.lastLogin?Utils.formatDate(u.lastLogin,'DD/MM/YYYY HH:MM'):'Never'}</span></div>
            <div class="info-row"><span class="info-label">Created</span><span>${Utils.formatDate(u.createdAt,'DD/MM/YYYY HH:MM')}</span></div>
          </div>`;
        this.showViewModal();
      }
    } catch (e) { Utils.showToast('Error', 'error'); }
    finally { Utils.hideLoading(); }
  }

  async saveUser() {
    const name = this.getFieldValue('fUserName');
    const email = this.getFieldValue('fUserEmail');
    const mobile = this.getFieldValue('fUserMobile');
    const password = this.getFieldValue('fUserPassword');
    const role = this.getFieldValue('fUserRole');
    const status = this.getFieldValue('fUserStatus');

    console.log('Form values:', {name, email, mobile, role, status});

    if (!name) { this.showModalError('Please enter name'); return; }
    if (!email) { this.showModalError('Please enter email'); return; }
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) { this.showModalError('Valid 10-digit mobile required'); return; }
    if (!this.editingId && !password) { this.showModalError('Password required for new user'); return; }
    if (password && password.length < 6) { this.showModalError('Password min 6 characters'); return; }

    const data = { name, email, mobile, role, status };
    if (password) data.password = password;

    this.setSaveLoading(true);
    this.hideModalError();
    try {
      const res = this.editingId ? await api.put(`/users/${this.editingId}`, data) : await api.post('/users', data);
      if (res.success) {
        this.closeModal();
        Utils.showToast(this.editingId ? 'Updated!' : 'Created!', 'success');
        await this.loadUsers();
      }
    } catch (e) { this.showModalError(e.message); }
    finally { this.setSaveLoading(false); }
  }

  async toggleStatus(id, cs) {
    const ns = cs === 'Active' ? 'Inactive' : 'Active';
    if (!await Utils.confirm(`${ns==='Active'?'Activate':'Deactivate'} this user?`)) return;
    try {
      await api.patch(`/users/status/${id}`, { status: ns });
      Utils.showToast('Status updated', 'success');
      await this.loadUsers();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  async resetPassword(id) {
    const pw = prompt('New password (min 6 chars):');
    if (!pw || pw.length < 6) { Utils.showToast('Min 6 characters', 'warning'); return; }
    if (!await Utils.confirm('Reset password?')) return;
    try {
      await api.post('/users/reset-password', { userId: id, newPassword: pw });
      Utils.showToast('Password reset!', 'success');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  async deleteUser(id) {
    if (id === auth.currentUser?._id) { Utils.showToast('Cannot delete yourself', 'warning'); return; }
    if (!await Utils.confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      Utils.showToast('Deleted!', 'success');
      await this.loadUsers();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  showModal() { document.getElementById('userModal').style.display = 'flex'; }
  closeModal() { document.getElementById('userModal').style.display = 'none'; this.editingId = null; }
  showViewModal() { document.getElementById('viewUserModal').style.display = 'flex'; }
  closeViewModal() { document.getElementById('viewUserModal').style.display = 'none'; }
  showModalError(m) { const d=document.getElementById('modalError'); if(d){d.style.display='block';d.querySelector('.alert').textContent=m;} }
  hideModalError() { const d=document.getElementById('modalError'); if(d)d.style.display='none'; }
  setSaveLoading(l) { const b=document.getElementById('saveUserBtn'),t=document.getElementById('saveBtnText'),s=document.getElementById('saveSpinner'); if(b)b.disabled=l; if(t)t.style.display=l?'none':'inline'; if(s)s.style.display=l?'inline-block':'none'; }
}

let usersModule;
document.addEventListener('DOMContentLoaded', () => { usersModule = new Users(); });