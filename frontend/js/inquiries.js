// Inquiries Page Logic
const inquiriesState = {
  page: 1,
  limit: CONFIG.DEFAULT_PAGE_SIZE,
  status: '',
  search: '',
  startDate: '',
  endDate: '',
  totalPages: 1
};

let inquiriesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadInquiries();
  setupEventListeners();
});

function setupEventListeners() {
  // Search (debounced)
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', Utils.debounce(() => {
    inquiriesState.search = searchInput.value.trim();
    inquiriesState.page = 1;
    loadInquiries();
  }, 350));

  // Status filter
  document.getElementById('statusFilter').addEventListener('change', (e) => {
    inquiriesState.status = e.target.value;
    inquiriesState.page = 1;
    loadInquiries();
  });

  // Date filters
  document.getElementById('startDateFilter').addEventListener('change', (e) => {
    inquiriesState.startDate = e.target.value;
    inquiriesState.page = 1;
    loadInquiries();
  });
  document.getElementById('endDateFilter').addEventListener('change', (e) => {
    inquiriesState.endDate = e.target.value;
    inquiriesState.page = 1;
    loadInquiries();
  });

  // Add new inquiry
  document.getElementById('addInquiryBtn').addEventListener('click', openAddModal);

  // Modal close controls
  document.getElementById('closeModal').addEventListener('click', closeInquiryModal);
  document.getElementById('cancelBtn').addEventListener('click', closeInquiryModal);
  document.getElementById('inquiryModal').addEventListener('click', (e) => {
    if (e.target.id === 'inquiryModal') closeInquiryModal();
  });

  document.getElementById('closeViewModal').addEventListener('click', closeViewModal);
  document.getElementById('closeViewBtn').addEventListener('click', closeViewModal);
  document.getElementById('viewInquiryModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewInquiryModal') closeViewModal();
  });

  // Save (create/update)
  document.getElementById('saveInquiryBtn').addEventListener('click', saveInquiry);
}

// ---------------- Stats ----------------
async function loadStats() {
  try {
    const res = await api.get('/inquiries/stats/summary');
    if (res.success) renderStats(res.data);
  } catch (error) {
    Utils.showToast(error.message || 'Failed to load stats', 'error');
  }
}

function renderStats(data) {
  const container = document.getElementById('inquiryStats');
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Inquiries</div>
      <div class="stat-value">${data.total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Today</div>
      <div class="stat-value">${data.today}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">This Month</div>
      <div class="stat-value">${data.monthly}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Follow-up</div>
      <div class="stat-value">${data.statusBreakdown.inquired}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Joined</div>
      <div class="stat-value">${data.statusBreakdown.joined}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Conversion Rate</div>
      <div class="stat-value">${data.conversionRate}</div>
    </div>
  `;
}

// ---------------- List & Table ----------------
async function loadInquiries() {
  const tbody = document.getElementById('inquiriesTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>`;

  try {
    const params = {
      page: inquiriesState.page,
      limit: inquiriesState.limit
    };
    if (inquiriesState.status) params.status = inquiriesState.status;
    if (inquiriesState.search) params.search = inquiriesState.search;
    if (inquiriesState.startDate) params.startDate = inquiriesState.startDate;
    if (inquiriesState.endDate) params.endDate = inquiriesState.endDate;

    const res = await api.get('/inquiries', params);

    if (res.success) {
      inquiriesCache = res.data;
      inquiriesState.totalPages = res.pagination.totalPages || 1;
      renderTable(res.data);
      Utils.renderPagination(inquiriesState.page, inquiriesState.totalPages, 'goToInquiriesPage');
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">Failed to load inquiries</td></tr>`;
    Utils.showToast(error.message || 'Failed to load inquiries', 'error');
  }
}

function goToInquiriesPage(page) {
  if (page < 1 || page > inquiriesState.totalPages) return;
  inquiriesState.page = page;
  loadInquiries();
}
window.goToInquiriesPage = goToInquiriesPage;

function renderTable(inquiries) {
  const tbody = document.getElementById('inquiriesTableBody');

  if (!inquiries || inquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No inquiries found</td></tr>`;
    return;
  }

  tbody.innerHTML = inquiries.map(inq => `
    <tr>
      <td>${Utils.escapeHtml(inq.inquiryId || '-')}</td>
      <td>${Utils.escapeHtml(inq.name)}</td>
      <td>${Utils.escapeHtml(inq.contactNumber)}</td>
      <td>${Utils.escapeHtml(inq.courseName || '-')}</td>
      <td>${renderStatusBadge(inq.status)}</td>
      <td>${Utils.formatDate(inq.inquiryDate)}</td>
      <td>${inq.followUpDate ? Utils.formatDate(inq.followUpDate) : '-'}</td>
      <td>${renderActions(inq)}</td>
    </tr>
  `).join('');
}

function renderStatusBadge(status) {
  const map = {
    'Inquired': 'inquiry-status-inquired',
    'Joined': 'inquiry-status-joined',
    'Cancelled': 'inquiry-status-cancelled'
  };
  return `<span class="inquiry-status-badge ${map[status] || ''}">${status}</span>`;
}

function renderActions(inq) {
  const viewBtn = `
    <button class="quick-action-btn reset" onclick="openViewModal('${inq._id}')">
      <svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      View
    </button>`;

  // Once joined, the record is locked from further status changes/edits
  if (inq.status === 'Joined') {
    return `
      <div class="btn-group">
        ${viewBtn}
        <span class="inquiry-locked-note">
          <svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          Converted
        </span>
      </div>`;
  }

  const editBtn = `
    <button class="quick-action-btn reset" onclick="openEditModal('${inq._id}')">
      <svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"/></svg>
      Edit
    </button>`;

  const deleteBtn = auth.isSuperAdmin() ? `
    <button class="quick-action-btn cancel" onclick="handleDeleteInquiry('${inq._id}')">
      <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
      Delete
    </button>` : '';

  if (inq.status === 'Cancelled') {
    return `
      <div class="btn-group">
        ${viewBtn}
        ${editBtn}
        <button class="quick-action-btn convert" onclick="handleResetInquiry('${inq._id}')">
          <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>
          Reset
        </button>
        ${deleteBtn}
      </div>`;
  }

  // Status === 'Inquired'
  return `
    <div class="btn-group">
      ${viewBtn}
      ${editBtn}
      <button class="quick-action-btn convert" onclick="handleConvertInquiry('${inq._id}')">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Convert
      </button>
      <button class="quick-action-btn cancel" onclick="handleCancelInquiry('${inq._id}')">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        Cancel
      </button>
      ${deleteBtn}
    </div>`;
}

// ---------------- Add / Edit Modal ----------------
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'New Inquiry';
  document.getElementById('inquiryForm').reset();
  document.getElementById('inquiryId').value = '';
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('inquiryModal').style.display = 'flex';
}

function openEditModal(id) {
  const inq = inquiriesCache.find(i => i._id === id);
  if (!inq) return;

  document.getElementById('modalTitle').textContent = 'Edit Inquiry';
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('inquiryId').value = inq._id;
  document.getElementById('name').value = inq.name || '';
  document.getElementById('contactNumber').value = inq.contactNumber || '';
  document.getElementById('parentContact').value = inq.parentContact || '';
  document.getElementById('qualification').value = inq.qualification || '';
  document.getElementById('courseName').value = inq.courseName || '';
  document.getElementById('inquiryDate').value = inq.inquiryDate ? Utils.formatDate(inq.inquiryDate, 'YYYY-MM-DD') : '';
  document.getElementById('status').value = inq.status || 'Inquired';
  document.getElementById('followUpDate').value = inq.followUpDate ? Utils.formatDate(inq.followUpDate, 'YYYY-MM-DD') : '';
  document.getElementById('address').value = inq.address || '';
  document.getElementById('comments').value = inq.comments || '';
  document.getElementById('followUpNotes').value = inq.followUpNotes || '';

  document.getElementById('inquiryModal').style.display = 'flex';
}
window.openEditModal = openEditModal;

function closeInquiryModal() {
  document.getElementById('inquiryModal').style.display = 'none';
}

async function saveInquiry(e) {
  e.preventDefault();

  const id = document.getElementById('inquiryId').value;
  const errorBox = document.getElementById('modalError');
  const errorText = errorBox.querySelector('.alert-error');
  const saveBtnText = document.getElementById('saveBtnText');
  const saveSpinner = document.getElementById('saveSpinner');

  const payload = {
    name: document.getElementById('name').value.trim(),
    contactNumber: document.getElementById('contactNumber').value.trim(),
    parentContact: document.getElementById('parentContact').value.trim(),
    qualification: document.getElementById('qualification').value.trim(),
    courseName: document.getElementById('courseName').value.trim(),
    inquiryDate: document.getElementById('inquiryDate').value,
    status: document.getElementById('status').value,
    address: document.getElementById('address').value.trim(),
    comments: document.getElementById('comments').value.trim(),
    followUpDate: document.getElementById('followUpDate').value,
    followUpNotes: document.getElementById('followUpNotes').value.trim()
  };

  errorBox.style.display = 'none';
  saveBtnText.textContent = id ? 'Updating...' : 'Saving...';
  saveSpinner.style.display = 'inline-block';
  document.getElementById('saveInquiryBtn').disabled = true;

  try {
    const res = id
      ? await api.put(`/inquiries/${id}`, payload)
      : await api.post('/inquiries', payload);

    if (res.success) {
      Utils.showToast(res.message || 'Inquiry saved successfully', 'success');
      closeInquiryModal();
      loadInquiries();
      loadStats();
    }
  } catch (error) {
    errorText.textContent = error.message || 'Failed to save inquiry';
    errorBox.style.display = 'block';
  } finally {
    saveBtnText.textContent = 'Save Inquiry';
    saveSpinner.style.display = 'none';
    document.getElementById('saveInquiryBtn').disabled = false;
  }
}

// ---------------- View Modal ----------------
async function openViewModal(id) {
  const container = document.getElementById('inquiryDetails');
  container.innerHTML = `<div class="text-center"><div class="spinner spinner-dark"></div> Loading...</div>`;
  document.getElementById('viewInquiryModal').style.display = 'flex';

  try {
    const res = await api.get(`/inquiries/${id}`);
    if (res.success) renderViewDetails(res.data);
  } catch (error) {
    container.innerHTML = `<p class="text-center">${Utils.escapeHtml(error.message || 'Failed to load inquiry')}</p>`;
  }
}
window.openViewModal = openViewModal;

function renderViewDetails(inq) {
  const container = document.getElementById('inquiryDetails');
  container.innerHTML = `
    <div class="form-row">
      <div><strong>Inquiry ID</strong><p>${Utils.escapeHtml(inq.inquiryId || '-')}</p></div>
      <div><strong>Status</strong><p>${renderStatusBadge(inq.status)}</p></div>
    </div>
    <div class="form-row">
      <div><strong>Name</strong><p>${Utils.escapeHtml(inq.name)}</p></div>
      <div><strong>Contact</strong><p>${Utils.escapeHtml(inq.contactNumber)}</p></div>
    </div>
    <div class="form-row">
      <div><strong>Parent Contact</strong><p>${Utils.escapeHtml(inq.parentContact || '-')}</p></div>
      <div><strong>Qualification</strong><p>${Utils.escapeHtml(inq.qualification || '-')}</p></div>
    </div>
    <div class="form-row">
      <div><strong>Interested Course</strong><p>${Utils.escapeHtml(inq.courseName || '-')}</p></div>
      <div><strong>Inquiry Date</strong><p>${Utils.formatDate(inq.inquiryDate)}</p></div>
    </div>
    <div class="form-row">
      <div><strong>Follow-up Date</strong><p>${inq.followUpDate ? Utils.formatDate(inq.followUpDate) : '-'}</p></div>
      <div><strong>Joining Date</strong><p>${inq.joiningDate ? Utils.formatDate(inq.joiningDate) : '-'}</p></div>
    </div>
    <div><strong>Address</strong><p>${Utils.escapeHtml(inq.address || '-')}</p></div>
    <div><strong>Comments</strong><p>${Utils.escapeHtml(inq.comments || '-')}</p></div>
    <div><strong>Follow-up Notes</strong><p>${Utils.escapeHtml(inq.followUpNotes || '-')}</p></div>
    ${inq.convertedToStudent ? `<div><strong>Converted Student</strong><p>${Utils.escapeHtml(inq.convertedToStudent.name)} (${Utils.escapeHtml(inq.convertedToStudent.studentId)})</p></div>` : ''}
    <div class="form-row">
      <div><strong>Created By</strong><p>${inq.createdBy ? Utils.escapeHtml(inq.createdBy.name) : '-'}</p></div>
      <div><strong>Updated By</strong><p>${inq.updatedBy ? Utils.escapeHtml(inq.updatedBy.name) : '-'}</p></div>
    </div>
  `;
}

function closeViewModal() {
  document.getElementById('viewInquiryModal').style.display = 'none';
}

// ---------------- Quick Actions ----------------
async function handleConvertInquiry(id) {
  const confirmed = await Utils.confirm('Convert this inquiry to a student record? This cannot be undone.');
  if (!confirmed) return;

  try {
    const res = await api.post(`/inquiries/${id}/convert`);
    if (res.success) {
      Utils.showToast(res.message || 'Converted to student successfully', 'success');
      loadInquiries();
      loadStats();
    }
  } catch (error) {
    Utils.showToast(error.message || 'Failed to convert inquiry', 'error');
  }
}
window.handleConvertInquiry = handleConvertInquiry;

async function handleCancelInquiry(id) {
  const confirmed = await Utils.confirm('Mark this inquiry as cancelled?');
  if (!confirmed) return;

  try {
    const res = await api.patch(`/inquiries/${id}/status`, { status: 'Cancelled' });
    if (res.success) {
      Utils.showToast(res.message || 'Inquiry cancelled', 'success');
      loadInquiries();
      loadStats();
    }
  } catch (error) {
    Utils.showToast(error.message || 'Failed to cancel inquiry', 'error');
  }
}
window.handleCancelInquiry = handleCancelInquiry;

async function handleResetInquiry(id) {
  const confirmed = await Utils.confirm('Reset this inquiry back to "Inquired"?');
  if (!confirmed) return;

  try {
    const res = await api.patch(`/inquiries/${id}/status`, { status: 'Inquired' });
    if (res.success) {
      Utils.showToast(res.message || 'Inquiry reset', 'success');
      loadInquiries();
      loadStats();
    }
  } catch (error) {
    Utils.showToast(error.message || 'Failed to reset inquiry', 'error');
  }
}
window.handleResetInquiry = handleResetInquiry;

async function handleDeleteInquiry(id) {
  const confirmed = await Utils.confirm('Delete this inquiry permanently? This cannot be undone.');
  if (!confirmed) return;

  try {
    const res = await api.delete(`/inquiries/${id}`);
    if (res.success) {
      Utils.showToast(res.message || 'Inquiry deleted', 'success');
      loadInquiries();
      loadStats();
    }
  } catch (error) {
    Utils.showToast(error.message || 'Failed to delete inquiry', 'error');
  }
}
window.handleDeleteInquiry = handleDeleteInquiry;