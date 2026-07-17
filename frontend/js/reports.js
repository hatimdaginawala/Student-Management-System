// Reports Module
class Reports {
  constructor() {
    this.currentReport = 'pending-fees';
    this.reportData = [];

    this.icons = {
      search: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.35-4.35" stroke-linecap="round"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>'
    };

    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) return;
    this.updateSidebar();
    this.setupGlobalListeners();
    await this.loadReport();
  }

  updateSidebar() {
    const user = auth.currentUser;
    if (!user) return;
    document.getElementById('userAvatar').textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
  }

  setupGlobalListeners() {
    // Menu
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Theme
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const t = Utils.getTheme() === 'light' ? 'dark' : 'light';
        Utils.setTheme(t);
        themeToggle.innerHTML = t === 'light' ? this.icons.moon : this.icons.sun;
      });

      // Set initial icon
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? this.icons.moon : this.icons.sun;
    }

    // Report tabs
    document.getElementById('reportTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.report-tab');
      if (!tab) return;
      document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.currentReport = tab.dataset.report;
      this.loadReport();
    });

    // Apply filter button - CRITICAL: Add listener AFTER DOM update
    document.getElementById('reportFilters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('#applyFilterBtn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        this.applyFilter();
      }
    });

    // Enter key on inputs
    document.getElementById('reportFilters')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        this.applyFilter();
      }
    });

    // Export
    document.getElementById('exportCSV')?.addEventListener('click', () => this.exportData('csv'));
    document.getElementById('exportJSON')?.addEventListener('click', () => this.exportData('json'));

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  applyFilter() {
    console.log('Applying filter for:', this.currentReport);
    const params = this.readFilterValues();
    console.log('Filter values:', params);
    this.loadReportWithParams(params);
  }

  readFilterValues() {
    const params = {};

    switch (this.currentReport) {
      case 'pending-fees':
        params.batchId = document.getElementById('batchFilter')?.value || '';
        params.minAmount = document.getElementById('minAmount')?.value || '';
        break;
      case 'payment-history':
        params.startDate = document.getElementById('startDate')?.value || '';
        params.endDate = document.getElementById('endDate')?.value || '';
        params.paymentMode = document.getElementById('paymentMode')?.value || '';
        params.groupBy = 'day';
        break;
      case 'monthly-collection':
        params.year = document.getElementById('yearFilter')?.value || new Date().getFullYear();
        break;
      case 'daily-collection':
        params.startDate = document.getElementById('startDate')?.value || '';
        params.endDate = document.getElementById('endDate')?.value || '';
        break;
      case 'student-wise':
        params.sort = document.getElementById('sortFilter')?.value || 'totalPaid';
        break;
    }

    // Remove empty params
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }

  async loadReport() {
    // First render filters
    this.renderFilters();

    // Wait for DOM to update
    await new Promise(r => setTimeout(r, 150));

    // Now read filter values and load
    const params = this.readFilterValues();
    await this.loadReportWithParams(params);
  }

  async loadReportWithParams(params) {
    console.log('Loading report:', this.currentReport, 'with params:', params);

    // Add cache-buster
    params._t = Date.now();

    // Show loading
    const tbody = document.getElementById('reportTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      switch (this.currentReport) {
        case 'pending-fees': await this.fetchPendingFees(params); break;
        case 'payment-history': await this.fetchPaymentHistory(params); break;
        case 'batch-revenue': await this.fetchBatchRevenue(params); break;
        case 'monthly-collection': await this.fetchMonthlyCollection(params); break;
        case 'daily-collection': await this.fetchDailyCollection(params); break;
        case 'student-wise': await this.fetchStudentWise(params); break;
        case 'batch-wise': await this.fetchBatchWise(params); break;
      }
    } catch (error) {
      console.error('Error:', error);
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error: ' + error.message + '</td></tr>';
    }
  }

  renderFilters() {
    const container = document.getElementById('reportFilters');
    if (!container) return;

    const applyBtn = `<button class="btn btn-primary" id="applyFilterBtn">${this.icons.search} Apply</button>`;
    let html = '';

    switch (this.currentReport) {
      case 'pending-fees':
        html = `
          <div class="form-group"><label>Batch</label><select id="batchFilter" class="form-control"><option value="">All Batches</option></select></div>
          <div class="form-group"><label>Min Pending (₹)</label><input type="number" id="minAmount" class="form-control" placeholder="Min amount"></div>
          ${applyBtn}
        `;
        break;
      case 'payment-history':
        html = `
          <div class="form-group"><label>Start Date</label><input type="date" id="startDate" class="form-control"></div>
          <div class="form-group"><label>End Date</label><input type="date" id="endDate" class="form-control"></div>
          <div class="form-group"><label>Mode</label><select id="paymentMode" class="form-control"><option value="">All</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option><option value="Cheque">Cheque</option></select></div>
          ${applyBtn}
        `;
        break;
      case 'monthly-collection':
        const y = new Date().getFullYear();
        html = `
          <div class="form-group"><label>Year</label><select id="yearFilter" class="form-control">${[y,y-1,y-2,y-3,y-4].map(yr => `<option value="${yr}">${yr}</option>`).join('')}</select></div>
          ${applyBtn}
        `;
        break;
      case 'daily-collection':
        html = `
          <div class="form-group"><label>Start Date</label><input type="date" id="startDate" class="form-control"></div>
          <div class="form-group"><label>End Date</label><input type="date" id="endDate" class="form-control"></div>
          ${applyBtn}
        `;
        break;
      case 'student-wise':
        html = `
          <div class="form-group"><label>Sort By</label><select id="sortFilter" class="form-control"><option value="totalPaid">Total Paid</option><option value="totalPending">Total Pending</option><option value="name">Name</option></select></div>
          ${applyBtn}
        `;
        break;
      default:
        html = '<p class="text-muted" style="padding:10px;">No filters available for this report</p>';
    }

    container.innerHTML = html;

    // Load batch dropdown if needed
    if (this.currentReport === 'pending-fees') {
      this.loadBatchDropdown();
    }
  }

  async loadBatchDropdown() {
    try {
      const res = await api.get('/batches', { limit: 100, _t: Date.now() });
      if (res.success) {
        const sel = document.getElementById('batchFilter');
        if (sel) {
          sel.innerHTML = '<option value="">All Batches</option>' +
            res.data.map(b => `<option value="${b._id}">${b.batchName}</option>`).join('');
        }
      }
    } catch (e) { console.error(e); }
  }

  // ============= FETCH METHODS =============

  async fetchPendingFees(p) {
    document.getElementById('reportTitle').textContent = 'Pending Fees Report';
    const res = await api.get('/reports/pending-fees', p);
    if (!res.success) return;
    this.reportData = res.data;

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card danger"><h4>Total Pending</h4><p>${Utils.formatCurrency(res.totalPending||0)}</p></div>
      <div class="summary-card warning"><h4>Students</h4><p>${res.count||0}</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Student</th><th>Batch</th><th>Fees</th><th>Paid</th><th>Pending</th><th>Last Payment</th></tr>';

    const data = res.data || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">
        <span style="display:inline-flex; width:20px; height:20px; vertical-align:middle; margin-right:8px; color: var(--success-dark);">${this.icons.check}</span>
        No pending fees!
      </td></tr>`;
    } else {
      tbody.innerHTML = data.map(i => `
        <tr><td><strong>${Utils.escapeHtml(i.student?.name||'N/A')}</strong></td>
        <td>${Utils.escapeHtml(i.batch?.batchName||'N/A')}</td>
        <td>${Utils.formatCurrency(i.finalFees)}</td>
        <td class="text-success">${Utils.formatCurrency(i.totalPaid)}</td>
        <td class="text-danger"><strong>${Utils.formatCurrency(i.pendingAmount)}</strong></td>
        <td>${i.lastPaymentDate?Utils.formatDate(i.lastPaymentDate):'-'}</td></tr>`).join('');
    }
  }

  async fetchPaymentHistory(p) {
    document.getElementById('reportTitle').textContent = 'Payment History';
    p.groupBy = 'day';
    const res = await api.get('/reports/payment-history', p);
    if (!res.success) return;
    this.reportData = res.data;
    const s = res.data.summary || {};

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card success"><h4>Total</h4><p>${Utils.formatCurrency(s.totalAmount||0)}</p></div>
      <div class="summary-card"><h4>Payments</h4><p>${s.totalPayments||0}</p></div>
      <div class="summary-card"><h4>Avg</h4><p>${Utils.formatCurrency(s.averageAmount||0)}</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Date</th><th>Payments</th><th>Total</th></tr>';

    const grouped = res.data.groupedData || [];
    const tbody = document.getElementById('reportTableBody');
    if (grouped.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No payments found</td></tr>';
    } else {
      tbody.innerHTML = grouped.map(g => `
        <tr><td><strong>${g.date}</strong></td><td><span class="badge badge-info">${g.count}</span></td><td><strong>${Utils.formatCurrency(g.total)}</strong></td></tr>`).join('');
    }
  }

  async fetchBatchRevenue(p) {
    document.getElementById('reportTitle').textContent = 'Batch Revenue';
    const res = await api.get('/reports/batch-revenue', p);
    if (!res.success) return;
    this.reportData = res.data;
    const s = res.data.overallSummary || {};

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card"><h4>Batches</h4><p>${s.totalBatches||0}</p></div>
      <div class="summary-card success"><h4>Collected</h4><p>${Utils.formatCurrency(s.totalCollectedRevenue||0)}</p></div>
      <div class="summary-card danger"><h4>Pending</h4><p>${Utils.formatCurrency(s.totalPendingRevenue||0)}</p></div>
      <div class="summary-card"><h4>Rate</h4><p>${s.overallCollectionPercentage||0}%</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Batch</th><th>Students</th><th>Expected</th><th>Collected</th><th>Pending</th><th>%</th></tr>';

    const data = res.data.batchDetails || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No data</td></tr>';
    } else {
      tbody.innerHTML = data.map(b => `
        <tr><td><strong>${Utils.escapeHtml(b.batchName)}</strong></td><td>${b.enrollmentCount}</td>
        <td>${Utils.formatCurrency(b.totalExpectedRevenue)}</td>
        <td class="text-success">${Utils.formatCurrency(b.totalCollectedRevenue)}</td>
        <td class="text-danger">${Utils.formatCurrency(b.pendingRevenue)}</td>
        <td>${b.collectionPercentage||0}%</td></tr>`).join('');
    }
  }

  async fetchMonthlyCollection(p) {
    document.getElementById('reportTitle').textContent = 'Monthly Collection';
    const res = await api.get('/reports/monthly-collection', p);
    if (!res.success) return;
    this.reportData = res.data;

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card success"><h4>Yearly</h4><p>${Utils.formatCurrency(res.data.yearlyTotal||0)}</p></div>
      <div class="summary-card"><h4>Monthly Avg</h4><p>${Utils.formatCurrency(res.data.monthlyAverage||0)}</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Month</th><th>Collection</th><th>Payments</th><th>Enrollments</th></tr>';

    const data = res.data.monthlyData || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No data</td></tr>';
    } else {
      tbody.innerHTML = data.map(m => `
        <tr><td><strong>${m.month} ${m.year}</strong></td>
        <td class="text-success"><strong>${Utils.formatCurrency(m.totalCollection)}</strong></td>
        <td>${m.paymentCount}</td><td>${m.newEnrollments}</td></tr>`).join('');
    }
  }

  async fetchDailyCollection(p) {
    document.getElementById('reportTitle').textContent = 'Daily Collection';
    const res = await api.get('/reports/daily-collection', p);
    if (!res.success) return;
    this.reportData = res.data;
    const s = res.data.summary || {};

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card success"><h4>Total</h4><p>${Utils.formatCurrency(s.totalCollection||0)}</p></div>
      <div class="summary-card"><h4>Daily Avg</h4><p>${Utils.formatCurrency(s.averageDailyCollection||0)}</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Date</th><th>Collection</th><th>Payments</th></tr>';

    const data = res.data.dailyData || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No data</td></tr>';
    } else {
      tbody.innerHTML = data.map(d => `
        <tr><td><strong>${Utils.formatDate(d.date)}</strong></td>
        <td class="text-success"><strong>${Utils.formatCurrency(d.totalAmount)}</strong></td>
        <td><span class="badge badge-info">${d.paymentCount}</span></td></tr>`).join('');
    }
  }

  async fetchStudentWise(p) {
    document.getElementById('reportTitle').textContent = 'Student-wise';
    const res = await api.get('/reports/student-wise-collection', p);
    if (!res.success) return;
    this.reportData = res.data;
    const s = res.data.summary || {};

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card"><h4>Students</h4><p>${s.totalStudents||0}</p></div>
      <div class="summary-card success"><h4>Collected</h4><p>${Utils.formatCurrency(s.totalCollection||0)}</p></div>
      <div class="summary-card danger"><h4>Pending</h4><p>${Utils.formatCurrency(s.totalPending||0)}</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Student</th><th>Enrollments</th><th>Fees</th><th>Paid</th><th>Pending</th></tr>';

    const data = res.data.students || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No data</td></tr>';
    } else {
      tbody.innerHTML = data.map(s => `
        <tr><td><strong>${Utils.escapeHtml(s.student?.name||'N/A')}</strong></td><td>${s.enrollmentCount}</td>
        <td>${Utils.formatCurrency(s.totalFees)}</td><td class="text-success">${Utils.formatCurrency(s.totalPaid)}</td>
        <td class="text-danger">${Utils.formatCurrency(s.totalPending)}</td></tr>`).join('');
    }
  }

  async fetchBatchWise(p) {
    document.getElementById('reportTitle').textContent = 'Batch-wise';
    const res = await api.get('/reports/batch-wise-collection', p);
    if (!res.success) return;
    this.reportData = res.data;
    const s = res.data.summary || {};

    document.getElementById('reportSummary').innerHTML = `
      <div class="summary-card"><h4>Batches</h4><p>${s.totalBatches||0}</p></div>
      <div class="summary-card success"><h4>Collected</h4><p>${Utils.formatCurrency(s.totalCollectedRevenue||0)}</p></div>
      <div class="summary-card danger"><h4>Pending</h4><p>${Utils.formatCurrency(s.totalPending||0)}</p></div>
      <div class="summary-card"><h4>Rate</h4><p>${s.overallCollectionRate||0}%</p></div>`;

    document.getElementById('reportTableHead').innerHTML = '<tr><th>Batch</th><th>Students</th><th>Expected</th><th>Collected</th><th>Pending</th><th>%</th></tr>';

    const data = res.data.batches || [];
    const tbody = document.getElementById('reportTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No data</td></tr>';
    } else {
      tbody.innerHTML = data.map(b => {
        const st = b.statistics || {}, inf = b.batch || {};
        return `<tr><td><strong>${Utils.escapeHtml(inf.name||'N/A')}</strong></td><td>${st.enrolledStudents||0}</td>
        <td>${Utils.formatCurrency(st.totalExpected||0)}</td><td class="text-success">${Utils.formatCurrency(st.totalCollected||0)}</td>
        <td class="text-danger">${Utils.formatCurrency(st.pending||0)}</td><td>${parseFloat(st.collectionRate)||0}%</td></tr>`;
      }).join('');
    }
  }

  // ============= EXPORT =============

  exportData(format) {
    if (!this.reportData || (Array.isArray(this.reportData) && this.reportData.length === 0)) {
      Utils.showToast('No data to export', 'warning'); return;
    }
    const ts = new Date().toISOString().split('T')[0];
    let content, fn, mt;
    if (format === 'json') {
      content = JSON.stringify(this.reportData, null, 2);
      fn = `${this.currentReport}-${ts}.json`; mt = 'application/json';
    } else {
      content = this.toCSV();
      fn = `${this.currentReport}-${ts}.csv`; mt = 'text/csv';
    }
    const blob = new Blob(['\uFEFF'+content], {type:mt});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=fn; a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},100);
    Utils.showToast('Exported!', 'success');
  }

  toCSV() {
    const data = Array.isArray(this.reportData) ? this.reportData : [this.reportData];
    if (!data.length) return '';
    const flatten = (o, p='') => {
      const r = {};
      for (const k in o) {
        const v = o[k], nk = p?`${p}_${k}`:k;
        if (v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date)) Object.assign(r, flatten(v,nk));
        else r[nk]=v;
      }
      return r;
    };
    const flat = data.map(d=>flatten(d));
    const headers = [...new Set(flat.flatMap(Object.keys))];
    const rows = flat.map(r=>headers.map(h=>{
      const v=r[h];
      if(v===null||v===undefined) return '';
      const s=String(v).replace(/"/g,'""');
      return /[,"\n]/.test(s)?`"${s}"`:s;
    }).join(','));
    return [headers.join(','),...rows].join('\n');
  }
}

// Initialize
let reportsModule;
document.addEventListener('DOMContentLoaded', () => { reportsModule = new Reports(); });