
const API_BASE = 'http://localhost:5000/api';

const EXPENSE_ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 3.5H6A2.5 2.5 0 0 0 3.5 6v5.5a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l6.1-6.1a2 2 0 0 0 0-2.8l-8-8a2 2 0 0 0-1.4-.6Z"/><circle cx="8" cy="8" r="1.3"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3h12v18l-2.5-1.6L13 21l-1.5-1.6L10 21l-2.5-1.6L5 21V3Z" stroke-linejoin="round"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.5c0-.8.7-1.5 1.5-1.5h7L19 7.5v12c0 .8-.7 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Z"/><path d="M13 3v4.5H19"/><path d="M8.5 12h7M8.5 15.5h5"/></svg>'
};

const EXPENSE_CATEGORY_COLORS = ['var(--brand-600)', 'var(--gold-600)', 'var(--slate-600)', 'var(--brick-600)'];

class Expenses {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.staffList = [];
    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) { window.location.href = 'login.html'; return; }
    if (auth.currentUser?.role !== 'Super Admin') { window.location.href = 'students.html'; return; }

    this.updateSidebar();
    this.setupEventListeners();
    await this.loadStaffDropdown();
    await this.loadStats();
    await this.loadExpenses();
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
        themeToggle.innerHTML = newTheme === 'light' ? EXPENSE_ICONS.moon : EXPENSE_ICONS.sun;
      });
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? EXPENSE_ICONS.moon : EXPENSE_ICONS.sun;
    }

    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(() => {
      this.currentPage = 1;
      this.loadExpenses();
    }, 500));

    document.getElementById('categoryFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadExpenses();
    });

    document.getElementById('paymentModeFilter')?.addEventListener('change', () => {
      this.currentPage = 1;
      this.loadExpenses();
    });

    document.getElementById('addExpenseBtn')?.addEventListener('click', () => this.openAddModal());

    document.getElementById('category')?.addEventListener('change', (e) => {
      const staffGroup = document.getElementById('staffSelectGroup');
      const isSalary = e.target.value === 'Salary';
      staffGroup.style.display = isSalary ? 'block' : 'none';
      document.getElementById('staffSelect').required = isSalary;
    });

    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('saveExpenseBtn')?.addEventListener('click', () => this.saveExpense());

    document.getElementById('expenseModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'expenseModal') this.closeModal();
    });
    document.getElementById('viewExpenseModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewExpenseModal') this.closeViewModal();
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  }

  async apiFetch(url, options = {}) {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...this.authHeaders(), ...(options.headers || {}) } });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async loadStaffDropdown() {
    try {
      const data = await this.apiFetch('/staff?limit=1000&status=Active');
      this.staffList = data.data || [];
      const select = document.getElementById('staffSelect');
      if (select) {
        select.innerHTML = '<option value="">Select Staff</option>' +
          this.staffList.map(s => `<option value="${s._id}">${Utils.escapeHtml(s.name)} (${s.staffId || 'N/A'})</option>`).join('');
      }
    } catch (e) { console.error('Error loading staff dropdown:', e); }
  }

  async loadStats() {
    try {
      const res = await this.apiFetch('/expenses/stats/summary');
      const d = res.data;
      document.getElementById('statTodayTotal').textContent = Utils.formatCurrency(d.today.total);
      document.getElementById('statTodayCount').textContent = `${d.today.count} entr${d.today.count === 1 ? 'y' : 'ies'}`;
      document.getElementById('statMonthlyTotal').textContent = Utils.formatCurrency(d.monthly.total);
      document.getElementById('statMonthlyCount').textContent = `${d.monthly.count} entr${d.monthly.count === 1 ? 'y' : 'ies'}`;
      document.getElementById('statAllTimeTotal').textContent = Utils.formatCurrency(d.allTime.total);
      document.getElementById('statAllTimeCount').textContent = `${d.allTime.count} entr${d.allTime.count === 1 ? 'y' : 'ies'}`;
      document.getElementById('statSalaryTotal').textContent = Utils.formatCurrency(d.salary.total);
      document.getElementById('statSalaryCount').textContent = `${d.salary.count} payment${d.salary.count === 1 ? '' : 's'}`;

      const chipsContainer = document.getElementById('categoryChips');
      if (chipsContainer && d.categoryBreakdown) {
        chipsContainer.innerHTML = d.categoryBreakdown.map((c, i) => `
          <span class="category-chip">
            <span class="dot" style="background:${EXPENSE_CATEGORY_COLORS[i % EXPENSE_CATEGORY_COLORS.length]}"></span>
            <span class="cat-name">${c._id}</span>
            <span class="cat-amount">${Utils.formatCurrency(c.total)}</span>
          </span>
        `).join('');
      }
    } catch (e) { console.error('Error loading expense stats:', e); }
  }

  async loadExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = new URLSearchParams({ page: this.currentPage, limit: this.pageSize });
      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.set('search', search);
      const category = document.getElementById('categoryFilter')?.value;
      if (category) params.set('category', category);
      const paymentMode = document.getElementById('paymentModeFilter')?.value;
      if (paymentMode) params.set('paymentMode', paymentMode);

      const res = await this.apiFetch(`/expenses?${params.toString()}`);
      this.totalPages = res.pagination?.totalPages || 1;
      this.renderExpenses(res.data);
      this.renderPagination();
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading expenses</td></tr>';
      Utils.showToast(e.message || 'Failed to load expenses', 'error');
    }
  }

  renderExpenses(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    if (!expenses || expenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No expenses found</td></tr>';
      return;
    }

    tbody.innerHTML = expenses.map(exp => `
      <tr>
        <td>${Utils.formatDate(exp.expenseDate)}</td>
        <td><span class="badge badge-primary">${exp.category}</span></td>
        <td>${Utils.escapeHtml(exp.description || '')}</td>
        <td><strong>${Utils.formatCurrency(exp.amount)}</strong></td>
        <td><span class="badge badge-info">${exp.paymentMode}</span></td>
        <td>${exp.staffId ? Utils.escapeHtml(exp.staffId.name) : (exp.paidTo ? Utils.escapeHtml(exp.paidTo) : '<span class="text-muted">-</span>')}</td>
        <td>
          <div class="btn-group" style="display: flex; gap: 6px;">
            <button class="btn-icon" title="View" onclick="expensesModule.viewExpense('${exp._id}')">${EXPENSE_ICONS.view}</button>
            <button class="btn-icon" title="Edit" onclick="expensesModule.openEditModal('${exp._id}')">${EXPENSE_ICONS.edit}</button>
            <button class="btn-icon" title="Delete" onclick="expensesModule.deleteExpense('${exp._id}')">${EXPENSE_ICONS.delete}</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    let html = `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="expensesModule.goToPage(${this.currentPage - 1})">← Previous</button>`;
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="expensesModule.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }
    html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="expensesModule.goToPage(${this.currentPage + 1})">Next →</button>`;
    container.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadExpenses();
  }

  openAddModal() {
    this.editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Expense';
    document.getElementById('saveBtnText').textContent = 'Save Expense';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('staffSelectGroup').style.display = 'none';
    document.getElementById('existingReceiptNote').style.display = 'none';
    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const res = await this.apiFetch(`/expenses/${id}`);
      const exp = res.data;

      this.editingId = id;
      document.getElementById('modalTitle').textContent = 'Edit Expense';
      document.getElementById('saveBtnText').textContent = 'Update Expense';

      document.getElementById('expenseId').value = exp._id;
      document.getElementById('expenseDate').value = exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : '';
      document.getElementById('category').value = exp.category || '';
      document.getElementById('amount').value = exp.amount || '';
      document.getElementById('paymentMode').value = exp.paymentMode || '';
      document.getElementById('description').value = exp.description || '';
      document.getElementById('paidTo').value = exp.paidTo || '';
      document.getElementById('receiptNumber').value = exp.receiptNumber || '';
      document.getElementById('remarks').value = exp.remarks || '';
      document.getElementById('receiptImage').value = '';

      const staffGroup = document.getElementById('staffSelectGroup');
      const isSalary = exp.category === 'Salary';
      staffGroup.style.display = isSalary ? 'block' : 'none';
      document.getElementById('staffSelect').value = exp.staffId?._id || exp.staffId || '';

      document.getElementById('existingReceiptNote').style.display = exp.receiptImage ? 'block' : 'none';

      this.hideModalError();
      this.showModal();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to load expense', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  async viewExpense(id) {
    try {
      Utils.showLoading();
      const res = await this.apiFetch(`/expenses/${id}`);
      const exp = res.data;
      document.getElementById('expenseDetails').innerHTML = this.buildExpenseDetailsHTML(exp);
      this.showViewModal();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to load expense details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  buildExpenseDetailsHTML(exp) {
    return `
      <div class="info-cards-grid">
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${EXPENSE_ICONS.tag}</span>
            <h4>Expense Details</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Date</span><span class="info-value">${Utils.formatDate(exp.expenseDate)}</span></div>
            <div class="info-row"><span class="info-label">Category</span><span class="info-value"><span class="badge badge-primary">${exp.category}</span></span></div>
            <div class="info-row"><span class="info-label">Amount</span><span class="info-value"><strong>${Utils.formatCurrency(exp.amount)}</strong></span></div>
            <div class="info-row"><span class="info-label">Payment Mode</span><span class="info-value"><span class="badge badge-info">${exp.paymentMode}</span></span></div>
            ${exp.staffId ? `<div class="info-row"><span class="info-label">Staff</span><span class="info-value">${Utils.escapeHtml(exp.staffId.name)} (${exp.staffId.staffId || 'N/A'})</span></div>` : ''}
            ${exp.paidTo ? `<div class="info-row"><span class="info-label">Paid To</span><span class="info-value">${Utils.escapeHtml(exp.paidTo)}</span></div>` : ''}
            ${exp.receiptNumber ? `<div class="info-row"><span class="info-label">Receipt No.</span><span class="info-value">${Utils.escapeHtml(exp.receiptNumber)}</span></div>` : ''}
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${EXPENSE_ICONS.notes}</span>
            <h4>Description & Remarks</h4>
          </div>
          <div class="info-card-body">
            <p class="notes-text">${Utils.escapeHtml(exp.description || '-')}</p>
            ${exp.remarks ? `<p class="notes-text" style="margin-top:10px;"><strong>Remarks:</strong> ${Utils.escapeHtml(exp.remarks)}</p>` : ''}
          </div>
        </div>

        ${exp.receiptImage ? `
        <div class="info-card" style="grid-column: 1 / -1;">
          <div class="info-card-header">
            <span class="info-card-icon">${EXPENSE_ICONS.receipt}</span>
            <h4>Receipt</h4>
          </div>
          <div class="info-card-body">
            <a href="${exp.receiptImage}" target="_blank" class="receipt-preview-link">${EXPENSE_ICONS.receipt} Open full image</a>
            <img src="${exp.receiptImage}" alt="Receipt" class="receipt-preview">
          </div>
        </div>` : ''}
      </div>

      <div class="timestamps-info">
        <small>Created: ${Utils.formatDate(exp.createdAt, 'DD/MM/YYYY HH:MM')}</small>
        ${exp.updatedAt ? `<small> | Updated: ${Utils.formatDate(exp.updatedAt, 'DD/MM/YYYY HH:MM')}</small>` : ''}
      </div>
    `;
  }

  async saveExpense() {
    const category = document.getElementById('category')?.value;
    const amount = document.getElementById('amount')?.value;
    const description = document.getElementById('description')?.value?.trim();
    const paymentMode = document.getElementById('paymentMode')?.value;
    const staffId = document.getElementById('staffSelect')?.value;

    if (!category) { this.showModalError('Please select a category'); return; }
    if (!amount || parseFloat(amount) <= 0) { this.showModalError('Please enter a valid amount'); return; }
    // if (!description) { this.showModalError('Please enter a description'); return; }
    if (!paymentMode) { this.showModalError('Please select a payment mode'); return; }
    if (category === 'Salary' && !staffId) { this.showModalError('Please select a staff member for Salary expenses'); return; }

    const formData = new FormData();
    formData.append('expenseDate', document.getElementById('expenseDate')?.value || new Date().toISOString());
    formData.append('category', category);
    formData.append('amount', amount);
    formData.append('description', description);
    formData.append('paymentMode', paymentMode);
    if (staffId) formData.append('staffId', staffId);
    const paidTo = document.getElementById('paidTo')?.value?.trim();
    if (paidTo) formData.append('paidTo', paidTo);
    const receiptNumber = document.getElementById('receiptNumber')?.value?.trim();
    if (receiptNumber) formData.append('receiptNumber', receiptNumber);
    const remarks = document.getElementById('remarks')?.value?.trim();
    if (remarks) formData.append('remarks', remarks);

    const fileInput = document.getElementById('receiptImage');
    if (fileInput?.files?.[0]) {
      formData.append('receiptImage', fileInput.files[0]);
    }

    this.setSaveLoading(true);
    this.hideModalError();

    try {
      const url = this.editingId ? `/expenses/${this.editingId}` : '/expenses';
      const method = this.editingId ? 'PUT' : 'POST';
      await this.apiFetch(url, { method, body: formData });

      this.closeModal();
      Utils.showToast(this.editingId ? 'Expense updated successfully' : 'Expense recorded successfully', 'success');
      await this.loadExpenses();
      await this.loadStats();
    } catch (e) {
      this.showModalError(e.message || 'Failed to save expense');
    } finally {
      this.setSaveLoading(false);
    }
  }

  async deleteExpense(id) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this expense?');
    if (!confirmed) return;
    try {
      await this.apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      Utils.showToast('Expense deleted successfully', 'success');
      await this.loadExpenses();
      await this.loadStats();
    } catch (e) {
      Utils.showToast(e.message || 'Failed to delete expense', 'error');
    }
  }

  showModal() { document.getElementById('expenseModal').style.display = 'flex'; }
  closeModal() { document.getElementById('expenseModal').style.display = 'none'; this.editingId = null; }
  showViewModal() { document.getElementById('viewExpenseModal').style.display = 'flex'; }
  closeViewModal() { document.getElementById('viewExpenseModal').style.display = 'none'; }

  showModalError(message) {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.querySelector('.alert').textContent = message; }
  }
  hideModalError() {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) errorDiv.style.display = 'none';
  }
  setSaveLoading(isLoading) {
    const btn = document.getElementById('saveExpenseBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveSpinner');
    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

let expensesModule;
document.addEventListener('DOMContentLoaded', () => {
  expensesModule = new Expenses();
});