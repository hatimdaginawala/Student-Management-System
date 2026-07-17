// Certificate Management Module
const CERT_ICONS = {
  edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
  apply: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" stroke-linejoin="round"/></svg>',
  receive: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6.5 9 17.5l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10a8 8 0 1 1 2 5.3" stroke-linecap="round"/><path d="M4 5v5h5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10.5" width="14" height="10" rx="1.75"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" stroke-linecap="round"/></svg>'
};

class Certificates {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 15;
    this.totalPages = 1;
    this.currentFilter = '';
    this.isSuperAdmin = auth.currentUser?.role === 'Super Admin';
    this.exportData = [];
    this.allBatches = {}; // Cache for batches
    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) { window.location.href = 'login.html'; return; }
    this.updateSidebar();
    this.setupEventListeners();
    await this.loadStats();
    await this.loadStudents();
  }

  updateSidebar() {
    const user = auth.currentUser;
    if (!user) return;
    document.getElementById('userAvatar').textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;

    if (!this.isSuperAdmin) {
      document.querySelectorAll('.super-admin-only, .admin-restricted').forEach(el => el.style.display = 'none');
    }
  }

  setupEventListeners() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    const tt = document.getElementById('themeToggle');
    if (tt) {
      tt.addEventListener('click', () => {
        const t = Utils.getTheme() === 'light' ? 'dark' : 'light';
        Utils.setTheme(t);
        tt.innerHTML = t === 'light' ?
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>' :
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>';
      });
    }

    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(() => {
      this.currentPage = 1; this.loadStudents();
    }, 400));

    document.getElementById('certStatusFilter')?.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.currentPage = 1;
      this.loadStudents();
      this.highlightStatCard(e.target.value);
    });

    document.querySelectorAll('.cert-stat-card').forEach(card => {
      card.addEventListener('click', () => {
        const filter = card.dataset.filter;
        const statusFilter = document.getElementById('certStatusFilter');
        if (statusFilter) {
          statusFilter.value = filter === 'all' ? '' : filter;
          this.currentFilter = filter === 'all' ? '' : filter;
          this.currentPage = 1;
          this.loadStudents();
          this.highlightStatCard(this.currentFilter);
        }
      });
    });

    document.getElementById('certStatus')?.addEventListener('change', (e) => {
      document.getElementById('certNumberGroup').style.display = e.target.value === 'Received' ? 'block' : 'none';
    });

    document.getElementById('closeCertModal')?.addEventListener('click', () => this.closeCertModal());
    document.getElementById('cancelCertBtn')?.addEventListener('click', () => this.closeCertModal());
    document.getElementById('saveCertBtn')?.addEventListener('click', () => this.updateCertificate());
    document.getElementById('certModal')?.addEventListener('click', (e) => { if (e.target.id === 'certModal') this.closeCertModal(); });

    // Export CSV
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.openExportModal());
    document.getElementById('closeExportModal')?.addEventListener('click', () => this.closeExportModal());
    document.getElementById('cancelExportBtn')?.addEventListener('click', () => this.closeExportModal());
    document.getElementById('exportModal')?.addEventListener('click', (e) => { if (e.target.id === 'exportModal') this.closeExportModal(); });
    document.getElementById('downloadCsvBtn')?.addEventListener('click', () => this.downloadCSV());

    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  highlightStatCard(filter) {
    document.querySelectorAll('.cert-stat-card').forEach(c => {
      c.classList.toggle('active-filter', c.dataset.filter === filter || (filter === '' && c.dataset.filter === 'all'));
    });
  }

  async loadStats() {
    try {
      const res = await api.get('/students/certificate/stats');
      if (res.success) {
        const d = res.data;
        const stats = d.certificateStats || {};
        document.getElementById('statTotal').textContent = d.totalStudents || 0;
        document.getElementById('statPending').textContent = stats.pending || 0;
        document.getElementById('statApplied').textContent = stats.applied || 0;
        document.getElementById('statReceived').textContent = stats.received || 0;
        document.getElementById('statPendingPct').textContent = (stats.pendingPercentage || 0) + '%';
        document.getElementById('statAppliedPct').textContent = (stats.appliedPercentage || 0) + '%';
        document.getElementById('statReceivedPct').textContent = (stats.receivedPercentage || 0) + '%';
      }
    } catch (e) { console.error('Stats error:', e); }
  }

  async loadStudents() {
    const tbody = document.getElementById('certTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = { page: this.currentPage, limit: this.pageSize, sort: '-createdAt' };
      const search = document.getElementById('searchInput')?.value?.trim();
      if (search) params.search = search;
      if (this.currentFilter) params.certificateStatus = this.currentFilter;

      const res = await api.get('/students', params);
      if (res.success) {
        this.totalPages = res.pagination?.totalPages || 1;
        this.renderTable(res.data);
        this.renderPagination();
      }
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading data</td></tr>';
      Utils.showToast(e.message, 'error');
    }
  }

  renderTable(students) {
    const tbody = document.getElementById('certTableBody');
    if (!tbody) return;
    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No students found</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(s => {
      const certStatus = s.certificateStatus || 'Certificate Pending';
      const statusClass = certStatus === 'Received' ? 'cert-status-received' : certStatus === 'Applied' ? 'cert-status-applied' : 'cert-status-pending';
      const isReceived = certStatus === 'Received';

      // Once a certificate is Received, it's a final state: no Apply, no Reset,
      // no re-triggering Receive. Only the manual "Update" (edit) action remains,
      // in case an admin genuinely needs to correct a mistake.
      const quickActions = isReceived
        ? `<span class="cert-locked-note">${CERT_ICONS.lock} Finalized</span>`
        : `
          ${certStatus !== 'Applied' ? `<button class="quick-action-btn apply" onclick="certificatesModule.quickUpdate('${s._id}','Applied','${Utils.escapeHtml(s.name)}')">${CERT_ICONS.apply} Apply</button>` : ''}
          <button class="quick-action-btn receive" onclick="certificatesModule.openUpdateModal('${s._id}','Received','${Utils.escapeHtml(s.name)}')">${CERT_ICONS.receive} Receive</button>
          ${certStatus !== 'Certificate Pending' ? `<button class="quick-action-btn reset" onclick="certificatesModule.quickUpdate('${s._id}','Certificate Pending','${Utils.escapeHtml(s.name)}')">${CERT_ICONS.reset} Reset</button>` : ''}
        `;

      return `
        <tr>
          <td><span class="badge badge-primary">${s.studentId || 'N/A'}</span></td>
          <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
          <td><span class="text-muted">-</span></td>
          <td>${s.mobile || 'N/A'}</td>
          <td><span class="cert-status-badge ${statusClass}">${certStatus}</span></td>
          <td>${s.certificateNumber ? `<span class="cert-number">${Utils.escapeHtml(s.certificateNumber)}</span>` : '<span class="text-muted">-</span>'}</td>
          <td>${s.certificateAppliedDate ? Utils.formatDate(s.certificateAppliedDate) : '<span class="text-muted">-</span>'}</td>
          <td>${s.certificateReceivedDate ? Utils.formatDate(s.certificateReceivedDate) : '<span class="text-muted">-</span>'}</td>
          <td>
            <div class="btn-group">
              ${quickActions}
              <button class="btn-icon" title="Update" onclick="certificatesModule.openUpdateModal('${s._id}','','${Utils.escapeHtml(s.name)}')">${CERT_ICONS.edit}</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  renderPagination() {
    const c = document.getElementById('pagination');
    if (!c || this.totalPages <= 1) { if (c) c.innerHTML = ''; return; }
    let h = `<button class="page-btn" ${this.currentPage===1?'disabled':''} onclick="certificatesModule.goToPage(${this.currentPage-1})">←</button>`;
    for (let i=1; i<=this.totalPages; i++) {
      if (i===1||i===this.totalPages||(i>=this.currentPage-2&&i<=this.currentPage+2)) {
        h += `<button class="page-btn ${i===this.currentPage?'active':''}" onclick="certificatesModule.goToPage(${i})">${i}</button>`;
      } else if (i===this.currentPage-3||i===this.currentPage+3) h += '<span class="page-dots">...</span>';
    }
    h += `<button class="page-btn" ${this.currentPage===this.totalPages?'disabled':''} onclick="certificatesModule.goToPage(${this.currentPage+1})">→</button>`;
    c.innerHTML = h;
  }

  goToPage(p) { if (p<1||p>this.totalPages) return; this.currentPage = p; this.loadStudents(); }

  async quickUpdate(studentId, status, studentName) {
    const confirmMsg = status === 'Applied' ? `Mark certificate as APPLIED for ${studentName}?` :
                       status === 'Received' ? `Mark certificate as RECEIVED for ${studentName}?` :
                       `Reset certificate status to PENDING for ${studentName}?`;
    if (!await Utils.confirm(confirmMsg)) return;

    try {
      const data = { certificateStatus: status };
      if (status === 'Received') {
        const certNo = prompt('Enter Certificate Number (optional):');
        if (certNo) data.certificateNumber = certNo;
      }
      const res = await api.patch(`/students/${studentId}/certificate`, data);
      if (res.success) {
        Utils.showToast(`Certificate status updated to "${status}"`, 'success');
        await this.loadStudents();
        await this.loadStats();
      }
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  openUpdateModal(studentId, defaultStatus, studentName) {
    document.getElementById('certStudentId').value = studentId;
    document.getElementById('certStudentInfo').innerHTML = `<strong>Student:</strong> ${studentName}`;
    document.getElementById('certStatus').value = defaultStatus || 'Certificate Pending';
    document.getElementById('certNumber').value = '';
    document.getElementById('certNumberGroup').style.display = (defaultStatus === 'Received') ? 'block' : 'none';
    document.getElementById('certModalTitle').textContent = 'Update Certificate Status';
    this.hideCertModalError();
    this.showCertModal();
  }

  async updateCertificate() {
    const studentId = document.getElementById('certStudentId')?.value;
    const status = document.getElementById('certStatus')?.value;
    const certNumber = document.getElementById('certNumber')?.value?.trim();

    if (!studentId || !status) { this.showCertModalError('Please select a status'); return; }

    const data = { certificateStatus: status };
    if (status === 'Received' && certNumber) data.certificateNumber = certNumber;

    this.setCertSaveLoading(true);
    try {
      const res = await api.patch(`/students/${studentId}/certificate`, data);
      if (res.success) {
        this.closeCertModal();
        Utils.showToast('Certificate updated!', 'success');
        await this.loadStudents();
        await this.loadStats();
      }
    } catch (e) { this.showCertModalError(e.message); }
    finally { this.setCertSaveLoading(false); }
  }

  // ==========================================
  // CSV EXPORT FUNCTIONS
  // ==========================================

  async fetchAllBatches() {
    // Fetch all batches and cache them by ID
    const batches = {};
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const res = await api.get('/batches', { page, limit: 100 });
        if (res.success && res.data.length > 0) {
          res.data.forEach(batch => {
            batches[batch._id] = batch;
          });
          if (res.data.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        hasMore = false;
      }
    }
    
    console.log('All batches loaded:', Object.keys(batches).length);
    return batches;
  }

  async fetchAllEnrollments() {
    // Fetch all enrollments
    const enrollments = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const res = await api.get('/enrollments', { page, limit: 100 });
        if (res.success && res.data.length > 0) {
          enrollments.push(...res.data);
          if (res.data.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        hasMore = false;
      }
    }
    
    console.log('All enrollments loaded:', enrollments.length);
    return enrollments;
  }

  async openExportModal() {
    try {
      document.getElementById('exportModal').style.display = 'flex';
      document.getElementById('csvPreview').innerHTML = '<div class="spinner spinner-dark"></div> Loading data...';
      document.getElementById('exportStudentCount').textContent = '...';
      document.getElementById('downloadCsvBtn').disabled = true;

      await this.fetchAllStudentsForExport();
      this.generateCSVPreview();
      document.getElementById('downloadCsvBtn').disabled = false;
    } catch (error) {
      console.error('Export error:', error);
      document.getElementById('csvPreview').innerHTML = '<span class="text-danger">Error loading data. Please try again.</span>';
      Utils.showToast('Failed to fetch data for export', 'error');
    }
  }

  async fetchAllStudentsForExport() {
    // First, load all batches for reference
    const batchesMap = await this.fetchAllBatches();
    
    // Then load all enrollments
    const enrollments = await this.fetchAllEnrollments();
    
    // Group enrollments by student ID
    const studentEnrollments = {};
    enrollments.forEach(enrollment => {
      const studentId = enrollment.studentId?._id || enrollment.studentId;
      if (!studentId) return;
      
      if (!studentEnrollments[studentId]) {
        studentEnrollments[studentId] = [];
      }
      
      const batchId = enrollment.batchId?._id || enrollment.batchId;
      const batch = batchId ? batchesMap[batchId] : null;
      
      studentEnrollments[studentId].push({
        enrollmentId: enrollment._id,
        batch: batch || null
      });
    });

    console.log('Student enrollment mapping:', studentEnrollments);

    // Fetch all students
    const allStudents = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const params = { page, limit: 100, sort: 'name' };
        
        const search = document.getElementById('searchInput')?.value?.trim();
        if (search) params.search = search;
        if (this.currentFilter) params.certificateStatus = this.currentFilter;
        
        const res = await api.get('/students', params);
        
        if (res.success && res.data.length > 0) {
          res.data.forEach(student => {
            const enrolls = studentEnrollments[student._id] || [];
            
            let batches = enrolls.map(e => ({
              batchName: e.batch?.batchName || 'N/A',
              courseName: e.batch?.courseName || 'N/A',
              duration: e.batch?.duration || 'N/A',
              startDate: e.batch?.startDate || null,
              endDate: e.batch?.endDate || null
            }));

            // If no enrollments found via enrollment API, try the student's enrolled batches if populated
            if (batches.length === 0 && student.enrolledBatches && student.enrolledBatches.length > 0) {
              batches = student.enrolledBatches.map(b => {
                const batch = typeof b === 'string' ? batchesMap[b] : b;
                return {
                  batchName: batch?.batchName || 'N/A',
                  courseName: batch?.courseName || 'N/A',
                  duration: batch?.duration || 'N/A',
                  startDate: batch?.startDate || null,
                  endDate: batch?.endDate || null
                };
              });
            }

            allStudents.push({
              studentId: student.studentId,
              name: student.name,
              photo: student.photo || '',
              mobile: student.mobile,
              certificateStatus: student.certificateStatus || 'Certificate Pending',
              batches: batches
            });
          });
          
          if (res.data.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching page:', page, error);
        hasMore = false;
      }
    }

    console.log('=== FINAL EXPORT DATA ===');
    console.log(JSON.stringify(allStudents.slice(0, 3), null, 2));
    
    this.exportData = allStudents;
    document.getElementById('exportStudentCount').textContent = allStudents.length;
  }

  generateCSVPreview() {
    const csvContent = this.generateCSVContent();
    const lines = csvContent.split('\n');
    
    // Show first 6 lines (header + 5 data rows) in preview
    const previewLines = lines.slice(0, 6).join('\n');
    const preview = document.getElementById('csvPreview');
    
    if (preview) {
      preview.innerHTML = previewLines || '<span class="text-muted">No data to export</span>';
    }
  }

  generateCSVContent() {
    if (!this.exportData || this.exportData.length === 0) {
      return '';
    }

    // CSV Header
    const headers = [
      'Student Name',
      'Batch Name',
      'Course Name',
      'Duration',
      'Student Image URL'
    ];

    // Escape CSV field
    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    // Generate rows
    const rows = this.exportData.map(student => {
      const studentName = escapeCsvField(student.name);
      const photoUrl = student.photo ? escapeCsvField(student.photo) : '';

      if (student.batches && student.batches.length > 0) {
        // Create a row for each batch
        return student.batches.map(batch => {
          const batchName = escapeCsvField(batch.batchName);
          const courseName = escapeCsvField(batch.courseName);
          const duration = escapeCsvField(batch.duration || 'N/A');
          
          return `${studentName},${batchName},${courseName},${duration},${photoUrl}`;
        }).join('\n');
      } else {
        // Student with no enrollments
        return `${studentName},N/A,N/A,N/A,${photoUrl}`;
      }
    });

    return headers.join(',') + '\n' + rows.join('\n');
  }

  downloadCSV() {
    if (!this.exportData || this.exportData.length === 0) {
      Utils.showToast('No data to export', 'error');
      return;
    }

    const csvContent = this.generateCSVContent();
    
    if (!csvContent) {
      Utils.showToast('No data to export', 'error');
      return;
    }

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `students-certificate-export-${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Utils.showToast(`CSV exported successfully! (${this.exportData.length} students)`, 'success');
    this.closeExportModal();
  }

  closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
    this.exportData = [];
  }

  // ==========================================
  // EXISTING MODAL FUNCTIONS
  // ==========================================

  showCertModal() { document.getElementById('certModal').style.display = 'flex'; }
  closeCertModal() { document.getElementById('certModal').style.display = 'none'; }
  showCertModalError(m) { const d=document.getElementById('certModalError'); if(d){d.style.display='block';d.querySelector('.alert').textContent=m;} }
  hideCertModalError() { const d=document.getElementById('certModalError'); if(d)d.style.display='none'; }
  setCertSaveLoading(l) { const b=document.getElementById('saveCertBtn'),t=document.getElementById('saveCertBtnText'),s=document.getElementById('certSaveSpinner'); if(b)b.disabled=l; if(t)t.style.display=l?'none':'inline'; if(s)s.style.display=l?'inline-block':'none'; }
}

let certificatesModule;
document.addEventListener('DOMContentLoaded', () => { certificatesModule = new Certificates(); });