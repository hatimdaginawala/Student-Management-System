// // Students Module
// const SMS_ICONS = {
//   view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
//   edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
//   delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
//   sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
//   moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>',
//   person: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.36-6.5 7.5-6.5s7.5 2.9 7.5 6.5"/></svg>',
//   phone: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5c0-.6.4-1 1-1h2.7c.5 0 .9.3 1 .8l.8 3.2c.1.4 0 .8-.3 1.1l-1.5 1.5a12 12 0 0 0 5.7 5.7l1.5-1.5c.3-.3.7-.4 1.1-.3l3.2.8c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1C9.6 20 4 14.4 4 6V5Z"/></svg>',
//   notes: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.5c0-.8.7-1.5 1.5-1.5h7L19 7.5v12c0 .8-.7 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Z"/><path d="M13 3v4.5H19"/><path d="M8.5 12h7M8.5 15.5h5"/></svg>',
//   books: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5c.83 0 1.5-.67 1.5-1.5v-13Z"/></svg>',
//   family: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 19c0-2.76 2.24-5 5-5s5 2.24 5 5"/><path d="M11 19c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>',
//   idcard: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.8 1.8-3 3-3s2.5 1.2 3 3"/><path d="M14 9.5h6M14 13h6M14 15.5h4"/></svg>'
// };

// class Students {
//   constructor() {
//     this.currentPage = 1;
//     this.pageSize = 10;
//     this.totalPages = 1;
//     this.editingId = null;

//     this.init();
//   }

//   async init() {
//     // Check authentication
//     if (!auth.isAuthenticated()) {
//       return;
//     }

//     // Update user info in sidebar
//     this.updateSidebar();

//     // Setup event listeners
//     this.setupEventListeners();

//     // Load students
//     await this.loadStudents();
//   }

//   updateSidebar() {
//     const user = auth.currentUser;
//     if (!user) return;

//     const userAvatar = document.getElementById('userAvatar');
//     const userName = document.getElementById('userName');
//     const userRole = document.getElementById('userRole');

//     if (userAvatar) {
//       userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
//     }
//     if (userName) userName.textContent = user.name;
//     if (userRole) userRole.textContent = user.role;
//   }

//   setupEventListeners() {
//     // Menu toggle for mobile
//     const menuToggle = document.getElementById('menuToggle');
//     const sidebar = document.getElementById('sidebar');
//     if (menuToggle && sidebar) {
//       menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
//     }

//     // Theme toggle
//     const themeToggle = document.getElementById('themeToggle');
//     if (themeToggle) {
//       themeToggle.addEventListener('click', () => {
//         const currentTheme = Utils.getTheme();
//         const newTheme = currentTheme === 'light' ? 'dark' : 'light';
//         Utils.setTheme(newTheme);
//         themeToggle.innerHTML = newTheme === 'light' ? SMS_ICONS.moon : SMS_ICONS.sun;
//       });
//       themeToggle.innerHTML = Utils.getTheme() === 'light' ? SMS_ICONS.moon : SMS_ICONS.sun;
//     }

//     // Search with debounce
//     const searchInput = document.getElementById('searchInput');
//     if (searchInput) {
//       searchInput.addEventListener('input', Utils.debounce(() => {
//         this.currentPage = 1;
//         this.loadStudents();
//       }, 500));
//     }

//     // Status filter
//     const statusFilter = document.getElementById('statusFilter');
//     if (statusFilter) {
//       statusFilter.addEventListener('change', () => {
//         this.currentPage = 1;
//         this.loadStudents();
//       });
//     }

//     // Add student button
//     const addBtn = document.getElementById('addStudentBtn');
//     if (addBtn) {
//       addBtn.addEventListener('click', () => this.openAddModal());
//     }

//     // Modal close buttons
//     document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
//     document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
//     document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
//     document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());

//     // Save student button
//     document.getElementById('saveStudentBtn')?.addEventListener('click', () => this.saveStudent());

//     // View profile button
//     document.getElementById('viewProfileBtn')?.addEventListener('click', () => {
//       if (this.viewingStudentId) {
//         window.location.href = `student-profile.html?id=${this.viewingStudentId}`;
//       }
//     });

//     // Close modals on overlay click
//     document.getElementById('studentModal')?.addEventListener('click', (e) => {
//       if (e.target.id === 'studentModal') this.closeModal();
//     });
//     document.getElementById('viewStudentModal')?.addEventListener('click', (e) => {
//       if (e.target.id === 'viewStudentModal') this.closeViewModal();
//     });

//     // Logout
//     document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
//   }

//   async loadStudents() {
//     const tbody = document.getElementById('studentsTableBody');
//     if (!tbody) return;

//     tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

//     try {
//       const params = {
//         page: this.currentPage,
//         limit: this.pageSize
//       };

//       const search = document.getElementById('searchInput')?.value.trim();
//       if (search) params.search = search;

//       const status = document.getElementById('statusFilter')?.value;
//       if (status) params.status = status;

//       const response = await api.get('/students', params);

//       if (response.success) {
//         this.totalPages = response.pagination.totalPages;
//         this.renderStudents(response.data);
//         this.renderPagination();
//       }
//     } catch (error) {
//       console.error('Error loading students:', error);
//       tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading students. Please try again.</td></tr>';
//       Utils.showToast(error.message || 'Failed to load students', 'error');
//     }
//   }

//   renderStudents(students) {
//     const tbody = document.getElementById('studentsTableBody');
//     if (!tbody) return;

//     if (!students || students.length === 0) {
//       tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
//       return;
//     }

//     tbody.innerHTML = students.map(student => `
//       <tr>
//         <td>
//           <span class="badge badge-primary">${student.studentId || 'N/A'}</span>
//         </td>
//         <td>
//           <strong>${Utils.escapeHtml(student.name)}</strong>
//         </td>
//         <td>${student.mobile || 'N/A'}</td>
//         <td>${student.email || 'N/A'}</td>
//         <td>${Utils.formatDate(student.joiningDate)}</td>
//         <td>
//           <span class="badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}">
//             ${student.status}
//           </span>
//         </td>
//         <td>
//           <div class="btn-group" style="display: flex; gap: 6px;">
//             <button class="btn-icon" title="View" onclick="students.viewStudent('${student._id}')">${SMS_ICONS.view}</button>
//             <button class="btn-icon" title="Edit" onclick="students.openEditModal('${student._id}')">${SMS_ICONS.edit}</button>
//             <button class="btn-icon" title="Delete" onclick="students.deleteStudent('${student._id}')">${SMS_ICONS.delete}</button>
//           </div>
//         </td>
//       </tr>
//     `).join('');
//   }

//   renderPagination() {
//     const container = document.getElementById('pagination');
//     if (!container || this.totalPages <= 1) {
//       if (container) container.innerHTML = '';
//       return;
//     }

//     let html = '';

//     // Previous button
//     html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''}
//              onclick="students.goToPage(${this.currentPage - 1})">← Previous</button>`;

//     // Page numbers
//     for (let i = 1; i <= this.totalPages; i++) {
//       if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
//         html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}"
//                  onclick="students.goToPage(${i})">${i}</button>`;
//       } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
//         html += '<span class="page-dots">...</span>';
//       }
//     }

//     // Next button
//     html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}
//              onclick="students.goToPage(${this.currentPage + 1})">Next →</button>`;

//     container.innerHTML = html;
//   }

//   goToPage(page) {
//     if (page < 1 || page > this.totalPages) return;
//     this.currentPage = page;
//     this.loadStudents();
//   }

// openAddModal() {
//     this.editingId = null;
//     document.getElementById('modalTitle').textContent = 'Add New Student';
//     document.getElementById('saveBtnText').textContent = 'Save Student';

//     // Clear form
//     document.getElementById('name').value = '';
//     document.getElementById('mobile').value = '';
//     document.getElementById('parentMobile').value = '';
//     document.getElementById('email').value = '';
//     document.getElementById('address').value = '';
//     document.getElementById('aadharNumber').value = '';
//     document.getElementById('photo').value = '';
//     document.getElementById('fatherName').value = '';
//     document.getElementById('motherName').value = '';
//     document.getElementById('fatherOccupation').value = '';
//     document.getElementById('motherOccupation').value = '';

//     // Set default joining date to today
//     const today = new Date().toISOString().split('T')[0];
//     document.getElementById('joiningDate').value = today;

//     document.getElementById('status').value = 'Active';
//     document.getElementById('notes').value = '';
//     document.getElementById('studentId').value = '';

//     this.hideModalError();
//     this.showModal();
//   }

// async openEditModal(id) {
//     try {
//       Utils.showLoading();
//       const response = await api.get(`/students/${id}`);

//       if (response.success) {
//         const student = response.data.student || response.data;

//         console.log('Editing student:', student);

//         this.editingId = id;
//         document.getElementById('modalTitle').textContent = 'Edit Student';
//         document.getElementById('saveBtnText').textContent = 'Update Student';

//         // Fill form with setTimeout to ensure DOM is ready
//         setTimeout(() => {
//           document.getElementById('name').value = student.name || '';
//           document.getElementById('mobile').value = student.mobile || '';
//           document.getElementById('parentMobile').value = student.parentMobile || '';
//           document.getElementById('email').value = student.email || '';
//           document.getElementById('address').value = student.address || '';
//           document.getElementById('aadharNumber').value = student.aadharNumber || '';
//           document.getElementById('photo').value = student.photo || '';
//           document.getElementById('fatherName').value = student.fatherName || '';
//           document.getElementById('motherName').value = student.motherName || '';
//           document.getElementById('fatherOccupation').value = student.fatherOccupation || '';
//           document.getElementById('motherOccupation').value = student.motherOccupation || '';

//           // Format date for input field
//           if (student.joiningDate) {
//             const date = new Date(student.joiningDate);
//             const formattedDate = date.toISOString().split('T')[0];
//             document.getElementById('joiningDate').value = formattedDate;
//           }

//           document.getElementById('status').value = student.status || 'Active';
//           document.getElementById('notes').value = student.notes || '';
//         }, 100);

//         this.hideModalError();
//         this.showModal();
//       }
//     } catch (error) {
//       console.error('Error loading student:', error);
//       Utils.showToast('Failed to load student details', 'error');
//     } finally {
//       Utils.hideLoading();
//     }
//   }

// async viewStudent(id) {
//     try {
//       Utils.showLoading();
//       const response = await api.get(`/students/${id}`);

//       if (response.success) {
//         const data = response.data;
//         const student = data.student || data;

//         console.log('Viewing student:', student);

//         this.viewingStudentId = id;

//         const detailsContainer = document.getElementById('studentDetails');
//         detailsContainer.innerHTML = this.buildStudentDetailsHTML(student, data.enrollments);

//         this.showViewModal();
//       }
//     } catch (error) {
//       console.error('Error viewing student:', error);
//       Utils.showToast('Failed to load student details', 'error');
//     } finally {
//       Utils.hideLoading();
//     }
//   }

//   buildStudentDetailsHTML(student, enrollments) {
//     const statusClass = student.status === 'Active' ? 'success' : 'danger';

//     return `
//       <!-- Student Info Header -->
//       <div class="student-profile-header">
//         <div class="student-avatar-large">
//           ${student.photo ? `<img src="${student.photo}" alt="${Utils.escapeHtml(student.name)}">` : student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//         </div>
//         <div class="student-header-info">
//           <h2>${Utils.escapeHtml(student.name)}</h2>
//           <span class="badge badge-${statusClass}">${student.status || 'N/A'}</span>
//           <span class="student-id-badge">${student.studentId || 'N/A'}</span>
//         </div>
//       </div>

//       <!-- Info Cards Grid -->
//       <div class="info-cards-grid">
//         <!-- Personal Information -->
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.person}</span>
//             <h4>Personal Information</h4>
//           </div>
//           <div class="info-card-body">
//             <div class="info-row">
//               <span class="info-label">Full Name</span>
//               <span class="info-value">${Utils.escapeHtml(student.name)}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Student ID</span>
//               <span class="info-value">${student.studentId || 'N/A'}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Status</span>
//               <span class="info-value">
//                 <span class="badge badge-${statusClass}">${student.status || 'N/A'}</span>
//               </span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Joining Date</span>
//               <span class="info-value">${Utils.formatDate(student.joiningDate, 'DD/MM/YYYY')}</span>
//             </div>
//             ${student.aadharNumber ? `
//             <div class="info-row">
//               <span class="info-label">Aadhar Number</span>
//               <span class="info-value">${Utils.escapeHtml(student.aadharNumber)}</span>
//             </div>` : ''}
//             <div class="info-row">
//               <span class="info-label">Certificate Status</span>
//               <span class="info-value">
//                 <span class="badge badge-${student.certificateStatus === 'Received' ? 'success' : student.certificateStatus === 'Applied' ? 'info' : 'warning'}">${student.certificateStatus || 'Certificate Pending'}</span>
//               </span>
//             </div>
//           </div>
//         </div>

//         <!-- Family Information -->
//         ${(student.fatherName || student.motherName || student.fatherOccupation || student.motherOccupation) ? `
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.family}</span>
//             <h4>Family Information</h4>
//           </div>
//           <div class="info-card-body">
//             ${student.fatherName ? `
//             <div class="info-row">
//               <span class="info-label">Father's Name</span>
//               <span class="info-value">${Utils.escapeHtml(student.fatherName)}</span>
//             </div>` : ''}
//             ${student.fatherOccupation ? `
//             <div class="info-row">
//               <span class="info-label">Father's Occupation</span>
//               <span class="info-value">${Utils.escapeHtml(student.fatherOccupation)}</span>
//             </div>` : ''}
//             ${student.motherName ? `
//             <div class="info-row">
//               <span class="info-label">Mother's Name</span>
//               <span class="info-value">${Utils.escapeHtml(student.motherName)}</span>
//             </div>` : ''}
//             ${student.motherOccupation ? `
//             <div class="info-row">
//               <span class="info-label">Mother's Occupation</span>
//               <span class="info-value">${Utils.escapeHtml(student.motherOccupation)}</span>
//             </div>` : ''}
//           </div>
//         </div>` : ''}

//         <!-- Contact Information -->
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.phone}</span>
//             <h4>Contact Information</h4>
//           </div>
//           <div class="info-card-body">
//             <div class="info-row">
//               <span class="info-label">Mobile</span>
//               <span class="info-value">
//                 <a href="tel:${student.mobile}">${student.mobile || 'N/A'}</a>
//               </span>
//             </div>
//             ${student.parentMobile ? `
//             <div class="info-row">
//               <span class="info-label">Parent Mobile</span>
//               <span class="info-value">
//                 <a href="tel:${student.parentMobile}">${student.parentMobile}</a>
//               </span>
//             </div>` : ''}
//             <div class="info-row">
//               <span class="info-label">Email</span>
//               <span class="info-value">
//                 ${student.email ? `<a href="mailto:${student.email}">${student.email}</a>` : 'N/A'}
//               </span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Address</span>
//               <span class="info-value">${student.address || 'N/A'}</span>
//             </div>
//           </div>
//         </div>

//         ${student.notes ? `
//         <!-- Notes -->
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.notes}</span>
//             <h4>Notes</h4>
//           </div>
//           <div class="info-card-body">
//             <p class="notes-text">${Utils.escapeHtml(student.notes)}</p>
//           </div>
//         </div>` : ''}

//         <!-- Enrollment Information -->
//         ${enrollments && enrollments.length > 0 ? `
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.books}</span>
//             <h4>Enrollments (${enrollments.length})</h4>
//           </div>
//           <div class="info-card-body">
//             <div class="enrollment-cards">
//               ${enrollments.map(e => this.buildEnrollmentCard(e)).join('')}
//             </div>
//           </div>
//         </div>` : `
//         <div class="info-card">
//           <div class="info-card-header">
//             <span class="info-card-icon">${SMS_ICONS.books}</span>
//             <h4>Enrollments</h4>
//           </div>
//           <div class="info-card-body">
//             <p class="text-muted">No enrollments found</p>
//           </div>
//         </div>`}
//       </div>

//       <!-- Timestamps -->
//       <div class="timestamps-info">
//         <small>Created: ${Utils.formatDate(student.createdAt, 'DD/MM/YYYY HH:MM')}</small>
//         ${student.updatedAt ? `<small> | Updated: ${Utils.formatDate(student.updatedAt, 'DD/MM/YYYY HH:MM')}</small>` : ''}
//       </div>
//     `;
//   }

//   buildEnrollmentCard(enrollment) {
//     const enrollmentData = enrollment.enrollment || enrollment;
//     const batch = enrollmentData.batchId || {};
//     const pendingAmount = enrollment.pendingAmount || 0;
//     const totalPaid = enrollment.totalPaid || 0;
//     const paymentStatus = enrollment.paymentStatus || (pendingAmount <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid');

//     const statusClass = paymentStatus === 'Paid' ? 'success' :
//                        paymentStatus === 'Partial' ? 'warning' : 'danger';

//     return `
//       <div class="enrollment-card">
//         <div class="enrollment-card-header">
//           <div>
//             <h5>${batch.batchName || 'N/A'}</h5>
//             <small>${batch.courseName || ''}</small>
//           </div>
//           <span class="badge badge-${statusClass}">${paymentStatus}</span>
//         </div>
//         <div class="enrollment-card-body">
//           <div class="enrollment-stats">
//             <div class="enrollment-stat">
//               <span class="stat-label">Total Fees</span>
//               <span class="stat-value">${Utils.formatCurrency(enrollmentData.finalFees || 0)}</span>
//             </div>
//             <div class="enrollment-stat">
//               <span class="stat-label">Paid</span>
//               <span class="stat-value text-success">${Utils.formatCurrency(totalPaid)}</span>
//             </div>
//             <div class="enrollment-stat">
//               <span class="stat-label">Pending</span>
//               <span class="stat-value text-danger">${Utils.formatCurrency(pendingAmount)}</span>
//             </div>
//           </div>
//           <div class="progress-bar">
//             <div class="progress-fill" style="width: ${enrollmentData.finalFees > 0 ? ((totalPaid / enrollmentData.finalFees) * 100) : 0}%"></div>
//           </div>
//         </div>
//       </div>
//     `;
//   }

// async saveStudent() {
//     // Get values directly from form elements instead of FormData
//     const name = document.getElementById('name')?.value?.trim();
//     const mobile = document.getElementById('mobile')?.value?.trim();
//     const parentMobile = document.getElementById('parentMobile')?.value?.trim();
//     const email = document.getElementById('email')?.value?.trim();
//     const address = document.getElementById('address')?.value?.trim();
//     const aadharNumber = document.getElementById('aadharNumber')?.value?.trim();
//     const photo = document.getElementById('photo')?.value?.trim();
//     const fatherName = document.getElementById('fatherName')?.value?.trim();
//     const motherName = document.getElementById('motherName')?.value?.trim();
//     const fatherOccupation = document.getElementById('fatherOccupation')?.value?.trim();
//     const motherOccupation = document.getElementById('motherOccupation')?.value?.trim();
//     const joiningDate = document.getElementById('joiningDate')?.value;
//     const status = document.getElementById('status')?.value;
//     const notes = document.getElementById('notes')?.value?.trim();

//     // Debug: Log values to check
//     console.log('Form values:', { name, mobile, parentMobile, email, address, joiningDate, status, notes });

//     // Basic validation
//     if (!name) {
//       this.showModalError('Please enter student name');
//       return;
//     }

//     if (!mobile) {
//       this.showModalError('Please enter mobile number');
//       return;
//     }

//     if (!/^[0-9]{10}$/.test(mobile)) {
//       this.showModalError('Please enter a valid 10-digit mobile number');
//       return;
//     }

//     if (aadharNumber && !/^[0-9]{12}$/.test(aadharNumber)) {
//       this.showModalError('Please enter a valid 12-digit Aadhar number');
//       return;
//     }

//     // Build data object with only provided fields
//     const data = {
//       name: name
//     };

//     // Add mobile (required)
//     data.mobile = mobile;

//     // Add optional fields only if they have values
//     if (parentMobile) data.parentMobile = parentMobile;
//     if (email) data.email = email;
//     if (address) data.address = address;
//     if (aadharNumber) data.aadharNumber = aadharNumber;
//     if (photo) data.photo = photo;
//     if (fatherName) data.fatherName = fatherName;
//     if (motherName) data.motherName = motherName;
//     if (fatherOccupation) data.fatherOccupation = fatherOccupation;
//     if (motherOccupation) data.motherOccupation = motherOccupation;
//     if (joiningDate) data.joiningDate = new Date(joiningDate).toISOString();
//     if (status) data.status = status;
//     if (notes) data.notes = notes;

//     console.log('Saving data:', data);

//     this.setSaveLoading(true);
//     this.hideModalError();

//     try {
//       let response;
//       if (this.editingId) {
//         console.log('Updating student:', this.editingId);
//         response = await api.put(`/students/${this.editingId}`, data);
//       } else {
//         console.log('Creating new student');
//         response = await api.post('/students', data);
//       }

//       console.log('Response:', response);

//       if (response.success) {
//         this.closeModal();
//         Utils.showToast(
//           this.editingId ? 'Student updated successfully' : 'Student created successfully',
//           'success'
//         );
//         await this.loadStudents();
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       this.showModalError(error.message || 'Failed to save student');
//     } finally {
//       this.setSaveLoading(false);
//     }
//   }

//   async deleteStudent(id) {
//     const confirmed = await Utils.confirm('Are you sure you want to delete this student? This will also delete all associated enrollments and payments.');

//     if (confirmed) {
//       try {
//         const response = await api.delete(`/students/${id}`);

//         if (response.success) {
//           Utils.showToast('Student deleted successfully', 'success');
//           await this.loadStudents();
//         }
//       } catch (error) {
//         Utils.showToast(error.message || 'Failed to delete student', 'error');
//       }
//     }
//   }

//   showModal() {
//     document.getElementById('studentModal').style.display = 'flex';
//   }

//   closeModal() {
//     document.getElementById('studentModal').style.display = 'none';
//     this.editingId = null;
//   }

//   showViewModal() {
//     document.getElementById('viewStudentModal').style.display = 'flex';
//   }

//   closeViewModal() {
//     document.getElementById('viewStudentModal').style.display = 'none';
//     this.viewingStudentId = null;
//   }

//   showModalError(message) {
//     const errorDiv = document.getElementById('modalError');
//     if (errorDiv) {
//       errorDiv.style.display = 'block';
//       errorDiv.querySelector('.alert').textContent = message;
//     }
//   }

//   hideModalError() {
//     const errorDiv = document.getElementById('modalError');
//     if (errorDiv) {
//       errorDiv.style.display = 'none';
//     }
//   }

//   setSaveLoading(isLoading) {
//     const btn = document.getElementById('saveStudentBtn');
//     const text = document.getElementById('saveBtnText');
//     const spinner = document.getElementById('saveSpinner');

//     if (btn) btn.disabled = isLoading;
//     if (text) text.style.display = isLoading ? 'none' : 'inline';
//     if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
//   }
// }

// // Initialize when DOM is loaded
// let students;
// document.addEventListener('DOMContentLoaded', () => {
//   students = new Students();
// });

// Students Module
// Students Module
const SMS_ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14 6.5l3 3"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.75"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.36-6.5 7.5-6.5s7.5 2.9 7.5 6.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5c0-.6.4-1 1-1h2.7c.5 0 .9.3 1 .8l.8 3.2c.1.4 0 .8-.3 1.1l-1.5 1.5a12 12 0 0 0 5.7 5.7l1.5-1.5c.3-.3.7-.4 1.1-.3l3.2.8c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1C9.6 20 4 14.4 4 6V5Z"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.5c0-.8.7-1.5 1.5-1.5h7L19 7.5v12c0 .8-.7 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Z"/><path d="M13 3v4.5H19"/><path d="M8.5 12h7M8.5 15.5h5"/></svg>',
  books: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5c.83 0 1.5-.67 1.5-1.5v-13Z"/></svg>',
  family: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 19c0-2.76 2.24-5 5-5s5 2.24 5 5"/><path d="M11 19c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>',
  idcard: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.8 1.8-3 3-3s2.5 1.2 3 3"/><path d="M14 9.5h6M14 13h6M14 15.5h4"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16V4M12 4l4 4M12 4l-4 4"/><path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="15" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 6l1-2h6l1 2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>'
};

class Students {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.editingId = null;
    this.selectedPhotoFile = null;

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

    // Load students
    await this.loadStudents();
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
    // Menu toggle for mobile
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
        themeToggle.innerHTML = newTheme === 'light' ? SMS_ICONS.moon : SMS_ICONS.sun;
      });
      themeToggle.innerHTML = Utils.getTheme() === 'light' ? SMS_ICONS.moon : SMS_ICONS.sun;
    }

    // Search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        this.currentPage = 1;
        this.loadStudents();
      }, 500));
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.loadStudents();
      });
    }

    // Add student button
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }

    // Modal close buttons
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('closeViewModal')?.addEventListener('click', () => this.closeViewModal());
    document.getElementById('closeViewBtn')?.addEventListener('click', () => this.closeViewModal());

    // Save student button
    document.getElementById('saveStudentBtn')?.addEventListener('click', () => this.saveStudent());

    // Photo upload area click
    const photoUploadArea = document.getElementById('photoUploadArea');
    if (photoUploadArea) {
      photoUploadArea.addEventListener('click', () => {
        console.log('Photo upload area clicked');
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
          photoInput.click();
        }
      });
    }

    // Photo input change
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        console.log('Photo input changed');
        this.handlePhotoSelect(e);
      });
    }

    // Remove photo button
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the upload area click
        console.log('Remove photo button clicked');
        this.removePhoto();
      });
    }

    // View profile button
    document.getElementById('viewProfileBtn')?.addEventListener('click', () => {
      if (this.viewingStudentId) {
        window.location.href = `student-profile.html?id=${this.viewingStudentId}`;
      }
    });

    // Close modals on overlay click
    document.getElementById('studentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'studentModal') this.closeModal();
    });
    document.getElementById('viewStudentModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'viewStudentModal') this.closeViewModal();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
  }

  async loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner spinner-dark"></div> Loading...</td></tr>';

    try {
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      };

      const search = document.getElementById('searchInput')?.value.trim();
      if (search) params.search = search;

      const status = document.getElementById('statusFilter')?.value;
      if (status) params.status = status;

      const response = await api.get('/students', params);

      if (response.success) {
        this.totalPages = response.pagination.totalPages;
        this.renderStudents(response.data);
        this.renderPagination();
      }
    } catch (error) {
      console.error('Error loading students:', error);
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading students. Please try again.</td></tr>';
      Utils.showToast(error.message || 'Failed to load students', 'error');
    }
  }

  renderStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(student => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="student-table-avatar">
              ${student.photo 
                ? `<img src="${student.photo}" alt="${Utils.escapeHtml(student.name)}" onerror="this.parentElement.innerHTML='${student.name.split(' ').map(n => n[0]).join('').toUpperCase()}'">`
                : student.name.split(' ').map(n => n[0]).join('').toUpperCase()
              }
            </div>
            <span class="badge badge-primary">${student.studentId || 'N/A'}</span>
          </div>
        </td>
        <td>
          <strong>${Utils.escapeHtml(student.name)}</strong>
        </td>
        <td>${student.mobile || 'N/A'}</td>
        <td>${student.email || 'N/A'}</td>
        <td>${Utils.formatDate(student.joiningDate)}</td>
        <td>
          <span class="badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}">
            ${student.status}
          </span>
        </td>
        <td>
          <div class="btn-group" style="display: flex; gap: 6px;">
            <button class="btn-icon" title="View" onclick="students.viewStudent('${student._id}')">${SMS_ICONS.view}</button>
            <button class="btn-icon" title="Edit" onclick="students.openEditModal('${student._id}')">${SMS_ICONS.edit}</button>
            <button class="btn-icon" title="Delete" onclick="students.deleteStudent('${student._id}')">${SMS_ICONS.delete}</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';

    // Previous button
    html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''}
             onclick="students.goToPage(${this.currentPage - 1})">← Previous</button>`;

    // Page numbers
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                 onclick="students.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }

    // Next button
    html += `<button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}
             onclick="students.goToPage(${this.currentPage + 1})">Next →</button>`;

    container.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadStudents();
  }

  handlePhotoSelect(event) {
    console.log('handlePhotoSelect called');
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Utils.showToast('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
      event.target.value = '';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Image size should be less than 5MB', 'error');
      event.target.value = '';
      return;
    }

    this.selectedPhotoFile = file;
    console.log('Photo file stored:', this.selectedPhotoFile);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('FileReader loaded');
      const preview = document.getElementById('photoPreview');
      const placeholder = document.getElementById('photoPlaceholder');
      const removeBtn = document.getElementById('removePhotoBtn');
      const previewImg = document.getElementById('photoPreviewImg');

      if (previewImg) {
        previewImg.src = e.target.result;
        console.log('Preview image src set');
      }
      if (preview) {
        preview.style.display = 'block';
        console.log('Preview displayed');
      }
      if (placeholder) {
        placeholder.style.display = 'none';
        console.log('Placeholder hidden');
      }
      if (removeBtn) {
        removeBtn.style.display = 'flex';
        console.log('Remove button shown');
      }
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    console.log('removePhoto called');
    this.selectedPhotoFile = null;
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
      photoInput.value = '';
      console.log('Photo input cleared');
    }

    const preview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');

    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
    
    console.log('Photo removed, UI reset');
  }

  openAddModal() {
    this.editingId = null;
    this.selectedPhotoFile = null;
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('saveBtnText').textContent = 'Save Student';

    // Clear form
    document.getElementById('name').value = '';
    document.getElementById('mobile').value = '';
    document.getElementById('parentMobile').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
    document.getElementById('aadharNumber').value = '';
    document.getElementById('fatherName').value = '';
    document.getElementById('motherName').value = '';
    document.getElementById('fatherOccupation').value = '';
    document.getElementById('motherOccupation').value = '';

    // Reset photo
    this.resetPhotoUpload();

    // Set default joining date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('joiningDate').value = today;

    document.getElementById('status').value = 'Active';
    document.getElementById('notes').value = '';
    document.getElementById('studentId').value = '';

    this.hideModalError();
    this.showModal();
  }

  async openEditModal(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/students/${id}`);

      if (response.success) {
        const student = response.data.student || response.data;

        console.log('Editing student:', student);

        this.editingId = id;
        this.selectedPhotoFile = null;
        document.getElementById('modalTitle').textContent = 'Edit Student';
        document.getElementById('saveBtnText').textContent = 'Update Student';

        // Reset photo upload
        this.resetPhotoUpload();

        // Fill form with setTimeout to ensure DOM is ready
        setTimeout(() => {
          document.getElementById('name').value = student.name || '';
          document.getElementById('mobile').value = student.mobile || '';
          document.getElementById('parentMobile').value = student.parentMobile || '';
          document.getElementById('email').value = student.email || '';
          document.getElementById('address').value = student.address || '';
          document.getElementById('aadharNumber').value = student.aadharNumber || '';
          document.getElementById('fatherName').value = student.fatherName || '';
          document.getElementById('motherName').value = student.motherName || '';
          document.getElementById('fatherOccupation').value = student.fatherOccupation || '';
          document.getElementById('motherOccupation').value = student.motherOccupation || '';

          // Format date for input field
          if (student.joiningDate) {
            const date = new Date(student.joiningDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('joiningDate').value = formattedDate;
          }

          document.getElementById('status').value = student.status || 'Active';
          document.getElementById('notes').value = student.notes || '';

          // Show existing photo if any
          this.showExistingPhoto(student.photo);
        }, 100);

        this.hideModalError();
        this.showModal();
      }
    } catch (error) {
      console.error('Error loading student:', error);
      Utils.showToast('Failed to load student details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  resetPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
      photoInput.value = '';
      console.log('Photo input reset');
    }

    const preview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    const previewImg = document.getElementById('photoPreviewImg');

    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
    if (previewImg) previewImg.src = '';
  }

  showExistingPhoto(photoUrl) {
    console.log('Showing existing photo:', photoUrl);
    const preview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    const previewImg = document.getElementById('photoPreviewImg');

    if (photoUrl) {
      if (previewImg) {
        previewImg.src = photoUrl;
        console.log('Preview image src set to:', photoUrl);
      }
      if (preview) {
        preview.style.display = 'block';
        console.log('Preview displayed');
      }
      if (placeholder) {
        placeholder.style.display = 'none';
        console.log('Placeholder hidden');
      }
      if (removeBtn) {
        removeBtn.style.display = 'flex';
        console.log('Remove button shown');
      }
    } else {
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
      console.log('No photo to show');
    }
  }

  async viewStudent(id) {
    try {
      Utils.showLoading();
      const response = await api.get(`/students/${id}`);

      if (response.success) {
        const data = response.data;
        const student = data.student || data;

        console.log('Viewing student:', student);

        this.viewingStudentId = id;

        const detailsContainer = document.getElementById('studentDetails');
        detailsContainer.innerHTML = this.buildStudentDetailsHTML(student, data.enrollments);

        this.showViewModal();
      }
    } catch (error) {
      console.error('Error viewing student:', error);
      Utils.showToast('Failed to load student details', 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  buildStudentDetailsHTML(student, enrollments) {
    const statusClass = student.status === 'Active' ? 'success' : 'danger';

    return `
      <!-- Student Info Header -->
      <div class="student-profile-header">
        <div class="student-avatar-large">
          ${student.photo 
            ? `<img src="${student.photo}" alt="${Utils.escapeHtml(student.name)}" onerror="this.innerHTML='${student.name.split(' ').map(n => n[0]).join('').toUpperCase()}'">` 
            : student.name.split(' ').map(n => n[0]).join('').toUpperCase()
          }
        </div>
        <div class="student-header-info">
          <h2>${Utils.escapeHtml(student.name)}</h2>
          <span class="badge badge-${statusClass}">${student.status || 'N/A'}</span>
          <span class="student-id-badge">${student.studentId || 'N/A'}</span>
        </div>
      </div>

      <!-- Info Cards Grid -->
      <div class="info-cards-grid">
        <!-- Personal Information -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.person}</span>
            <h4>Personal Information</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">Full Name</span>
              <span class="info-value">${Utils.escapeHtml(student.name)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Student ID</span>
              <span class="info-value">${student.studentId || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value">
                <span class="badge badge-${statusClass}">${student.status || 'N/A'}</span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Joining Date</span>
              <span class="info-value">${Utils.formatDate(student.joiningDate, 'DD/MM/YYYY')}</span>
            </div>
            ${student.aadharNumber ? `
            <div class="info-row">
              <span class="info-label">Aadhar Number</span>
              <span class="info-value">${Utils.escapeHtml(student.aadharNumber)}</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">Certificate Status</span>
              <span class="info-value">
                <span class="badge badge-${student.certificateStatus === 'Received' ? 'success' : student.certificateStatus === 'Applied' ? 'info' : 'warning'}">${student.certificateStatus || 'Certificate Pending'}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Family Information -->
        ${(student.fatherName || student.motherName || student.fatherOccupation || student.motherOccupation) ? `
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.family}</span>
            <h4>Family Information</h4>
          </div>
          <div class="info-card-body">
            ${student.fatherName ? `
            <div class="info-row">
              <span class="info-label">Father's Name</span>
              <span class="info-value">${Utils.escapeHtml(student.fatherName)}</span>
            </div>` : ''}
            ${student.fatherOccupation ? `
            <div class="info-row">
              <span class="info-label">Father's Occupation</span>
              <span class="info-value">${Utils.escapeHtml(student.fatherOccupation)}</span>
            </div>` : ''}
            ${student.motherName ? `
            <div class="info-row">
              <span class="info-label">Mother's Name</span>
              <span class="info-value">${Utils.escapeHtml(student.motherName)}</span>
            </div>` : ''}
            ${student.motherOccupation ? `
            <div class="info-row">
              <span class="info-label">Mother's Occupation</span>
              <span class="info-value">${Utils.escapeHtml(student.motherOccupation)}</span>
            </div>` : ''}
          </div>
        </div>` : ''}

        <!-- Contact Information -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.phone}</span>
            <h4>Contact Information</h4>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">Mobile</span>
              <span class="info-value">
                <a href="tel:${student.mobile}">${student.mobile || 'N/A'}</a>
              </span>
            </div>
            ${student.parentMobile ? `
            <div class="info-row">
              <span class="info-label">Parent Mobile</span>
              <span class="info-value">
                <a href="tel:${student.parentMobile}">${student.parentMobile}</a>
              </span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">
                ${student.email ? `<a href="mailto:${student.email}">${student.email}</a>` : 'N/A'}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Address</span>
              <span class="info-value">${student.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        ${student.notes ? `
        <!-- Notes -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.notes}</span>
            <h4>Notes</h4>
          </div>
          <div class="info-card-body">
            <p class="notes-text">${Utils.escapeHtml(student.notes)}</p>
          </div>
        </div>` : ''}

        <!-- Enrollment Information -->
        ${enrollments && enrollments.length > 0 ? `
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.books}</span>
            <h4>Enrollments (${enrollments.length})</h4>
          </div>
          <div class="info-card-body">
            <div class="enrollment-cards">
              ${enrollments.map(e => this.buildEnrollmentCard(e)).join('')}
            </div>
          </div>
        </div>` : `
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-card-icon">${SMS_ICONS.books}</span>
            <h4>Enrollments</h4>
          </div>
          <div class="info-card-body">
            <p class="text-muted">No enrollments found</p>
          </div>
        </div>`}
      </div>

      <!-- Timestamps -->
      <div class="timestamps-info">
        <small>Created: ${Utils.formatDate(student.createdAt, 'DD/MM/YYYY HH:MM')}</small>
        ${student.updatedAt ? `<small> | Updated: ${Utils.formatDate(student.updatedAt, 'DD/MM/YYYY HH:MM')}</small>` : ''}
      </div>
    `;
  }

  buildEnrollmentCard(enrollment) {
    const enrollmentData = enrollment.enrollment || enrollment;
    const batch = enrollmentData.batchId || {};
    const pendingAmount = enrollment.pendingAmount || 0;
    const totalPaid = enrollment.totalPaid || 0;
    const paymentStatus = enrollment.paymentStatus || (pendingAmount <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid');

    const statusClass = paymentStatus === 'Paid' ? 'success' :
                       paymentStatus === 'Partial' ? 'warning' : 'danger';

    return `
      <div class="enrollment-card">
        <div class="enrollment-card-header">
          <div>
            <h5>${batch.batchName || 'N/A'}</h5>
            <small>${batch.courseName || ''}</small>
          </div>
          <span class="badge badge-${statusClass}">${paymentStatus}</span>
        </div>
        <div class="enrollment-card-body">
          <div class="enrollment-stats">
            <div class="enrollment-stat">
              <span class="stat-label">Total Fees</span>
              <span class="stat-value">${Utils.formatCurrency(enrollmentData.finalFees || 0)}</span>
            </div>
            <div class="enrollment-stat">
              <span class="stat-label">Paid</span>
              <span class="stat-value text-success">${Utils.formatCurrency(totalPaid)}</span>
            </div>
            <div class="enrollment-stat">
              <span class="stat-label">Pending</span>
              <span class="stat-value text-danger">${Utils.formatCurrency(pendingAmount)}</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${enrollmentData.finalFees > 0 ? ((totalPaid / enrollmentData.finalFees) * 100) : 0}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  async saveStudent() {
    // Get values directly from form elements
    const name = document.getElementById('name')?.value?.trim();
    const mobile = document.getElementById('mobile')?.value?.trim();
    const parentMobile = document.getElementById('parentMobile')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const aadharNumber = document.getElementById('aadharNumber')?.value?.trim();
    const fatherName = document.getElementById('fatherName')?.value?.trim();
    const motherName = document.getElementById('motherName')?.value?.trim();
    const fatherOccupation = document.getElementById('fatherOccupation')?.value?.trim();
    const motherOccupation = document.getElementById('motherOccupation')?.value?.trim();
    const joiningDate = document.getElementById('joiningDate')?.value;
    const status = document.getElementById('status')?.value;
    const notes = document.getElementById('notes')?.value?.trim();

    console.log('Form values:', { name, mobile, parentMobile, email, address, joiningDate, status, notes });
    console.log('Selected photo file:', this.selectedPhotoFile);

    // Basic validation
    if (!name) {
      this.showModalError('Please enter student name');
      return;
    }

    if (!mobile) {
      this.showModalError('Please enter mobile number');
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      this.showModalError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (parentMobile && !/^[0-9]{10}$/.test(parentMobile)) {
      this.showModalError('Please enter a valid 10-digit parent mobile number');
      return;
    }

    if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      this.showModalError('Please enter a valid email address');
      return;
    }

    if (aadharNumber && !/^[0-9]{12}$/.test(aadharNumber)) {
      this.showModalError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    // Use FormData to support file upload
    const formData = new FormData();
    
    // Add required fields
    formData.append('name', name);
    formData.append('mobile', mobile);

    // Add optional fields if they have values
    if (parentMobile) formData.append('parentMobile', parentMobile);
    if (email) formData.append('email', email);
    if (address) formData.append('address', address);
    if (aadharNumber) formData.append('aadharNumber', aadharNumber);
    if (fatherName) formData.append('fatherName', fatherName);
    if (motherName) formData.append('motherName', motherName);
    if (fatherOccupation) formData.append('fatherOccupation', fatherOccupation);
    if (motherOccupation) formData.append('motherOccupation', motherOccupation);
    if (joiningDate) formData.append('joiningDate', new Date(joiningDate).toISOString());
    if (status) formData.append('status', status);
    if (notes) formData.append('notes', notes);

    // Add photo if selected
    if (this.selectedPhotoFile) {
      formData.append('photo', this.selectedPhotoFile);
      console.log('Photo file appended to FormData:', this.selectedPhotoFile.name);
    } else {
      console.log('No photo file selected');
    }

    // Log form data entries for debugging
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    this.setSaveLoading(true);
    this.hideModalError();

    try {
      let response;
      if (this.editingId) {
        console.log('Updating student:', this.editingId);
        response = await api.upload(`/students/${this.editingId}`, formData, 'PUT');
      } else {
        console.log('Creating new student');
        response = await api.upload('/students', formData, 'POST');
      }

      console.log('Response:', response);

      if (response.success) {
        this.closeModal();
        Utils.showToast(
          this.editingId ? 'Student updated successfully' : 'Student created successfully',
          'success'
        );
        await this.loadStudents();
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showModalError(error.message || 'Failed to save student');
    } finally {
      this.setSaveLoading(false);
    }
  }

  async deleteStudent(id) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this student? This will also delete all associated enrollments and payments.');

    if (confirmed) {
      try {
        const response = await api.delete(`/students/${id}`);

        if (response.success) {
          Utils.showToast('Student deleted successfully', 'success');
          await this.loadStudents();
        }
      } catch (error) {
        Utils.showToast(error.message || 'Failed to delete student', 'error');
      }
    }
  }

  showModal() {
    document.getElementById('studentModal').style.display = 'flex';
  }

  closeModal() {
    document.getElementById('studentModal').style.display = 'none';
    this.editingId = null;
    this.selectedPhotoFile = null;
  }

  showViewModal() {
    document.getElementById('viewStudentModal').style.display = 'flex';
  }

  closeViewModal() {
    document.getElementById('viewStudentModal').style.display = 'none';
    this.viewingStudentId = null;
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
    const btn = document.getElementById('saveStudentBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveSpinner');

    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

// Initialize when DOM is loaded
let students;
document.addEventListener('DOMContentLoaded', () => {
  students = new Students();
});