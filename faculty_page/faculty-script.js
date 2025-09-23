// Faculty Dashboard JavaScript
let currentUser = null;
let studentsData = [];
let certificatesData = [];
let coursesData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Check authentication
        const response = await fetch('/api/user-profile');
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            updateWelcomeMessage();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.location.href = '/login';
    }
}

// Update welcome message
function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (currentUser) {
        const name = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        welcomeMessage.textContent = `Welcome back, ${name || currentUser.username}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    const menuLinks = document.querySelectorAll('.menu-link[data-section]');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Search functionality
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', filterStudents);
    }

    const certificateSearch = document.getElementById('certificateSearch');
    if (certificateSearch) {
        certificateSearch.addEventListener('input', filterCertificates);
    }

    // Form submission
    const createStudentForm = document.getElementById('createStudentForm');
    if (createStudentForm) {
        createStudentForm.addEventListener('submit', handleCreateStudent);
    }

    // Filters
    const courseFilter = document.getElementById('courseFilter');
    const batchFilter = document.getElementById('batchFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (courseFilter) courseFilter.addEventListener('change', filterStudents);
    if (batchFilter) batchFilter.addEventListener('change', filterStudents);
    if (statusFilter) statusFilter.addEventListener('change', filterCertificates);
}

// Navigation functions
function showSection(sectionId) {
    // Update menu active states
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });

    // Update content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    // Load section-specific data
    loadSectionData(sectionId);
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudentsData();
            break;
        case 'certificates':
            loadCertificatesData();
            break;
        case 'create-student':
            populateCreateStudentForm();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load summary statistics
        const [statsResponse, activitiesResponse] = await Promise.all([
            fetch('/api/faculty/dashboard-stats'),
            fetch('/api/faculty/recent-activities')
        ]);
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats);
        }
        
        if (activitiesResponse.ok) {
            const activities = await activitiesResponse.json();
            updateRecentActivities(activities);
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('totalCertificates').textContent = stats.totalCertificates || 0;
    document.getElementById('pendingVerifications').textContent = stats.pendingVerifications || 0;
    document.getElementById('averageCGPA').textContent = (stats.averageCGPA || 0).toFixed(1);
}

// Update recent activities
function updateRecentActivities(activities) {
    const tbody = document.getElementById('recentActivities');
    
    if (!activities || activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No recent activities</td></tr>';
        return;
    }
    
    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user" style="color: #6b7280;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600;">${activity.name}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">${activity.email}</div>
                    </div>
                </div>
            </td>
            <td>${activity.register_number}</td>
            <td>${activity.course}</td>
            <td>
                <span style="font-weight: 600; color: ${activity.cgpa >= 8.5 ? '#059669' : activity.cgpa >= 7.0 ? '#f59e0b' : '#dc2626'};">
                    ${activity.cgpa.toFixed(2)}
                </span>
            </td>
            <td>${formatDate(activity.last_activity)}</td>
            <td>
                <span class="status-badge status-${activity.status.toLowerCase()}">
                    ${activity.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Load students data
async function loadStudentsData() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/faculty/students');
        if (response.ok) {
            studentsData = await response.json();
            populateStudentsTable(studentsData);
            populateFilters();
        } else {
            throw new Error('Failed to load students data');
        }
        
    } catch (error) {
        console.error('Error loading students data:', error);
        showNotification('Error loading students data', 'error');
    } finally {
        showLoading(false);
    }
}

// Populate students table
function populateStudentsTable(students) {
    const tbody = document.getElementById('studentsTable');
    
    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6b7280;">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                    ${student.profile_image ? 
                        `<img src="${student.profile_image}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                        `<i class="fas fa-user" style="color: #6b7280;"></i>`
                    }
                </div>
            </td>
            <td>
                <div style="font-weight: 600;">${student.first_name} ${student.last_name}</div>
                <div style="font-size: 0.85rem; color: #6b7280;">${student.email}</div>
            </td>
            <td>${student.register_number}</td>
            <td>${student.course_name || 'N/A'}</td>
            <td>${student.batch_year}</td>
            <td>
                <span style="font-weight: 600; color: ${student.current_cgpa >= 8.5 ? '#059669' : student.current_cgpa >= 7.0 ? '#f59e0b' : '#dc2626'};">
                    ${student.current_cgpa.toFixed(2)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${student.enrollment_status.toLowerCase()}">
                    ${student.enrollment_status}
                </span>
            </td>
            <td>
                <button class="btn" style="padding: 5px 10px; font-size: 0.8rem; background: #6366f1; color: white;" onclick="viewStudent(${student.student_id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter students
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const courseFilter = document.getElementById('courseFilter').value;
    const batchFilter = document.getElementById('batchFilter').value;
    
    let filteredStudents = studentsData.filter(student => {
        const matchesSearch = !searchTerm || 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.register_number.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm);
            
        const matchesCourse = !courseFilter || student.course_id == courseFilter;
        const matchesBatch = !batchFilter || student.batch_year == batchFilter;
        
        return matchesSearch && matchesCourse && matchesBatch;
    });
    
    populateStudentsTable(filteredStudents);
}

// Load certificates data
async function loadCertificatesData() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/faculty/certificates');
        if (response.ok) {
            certificatesData = await response.json();
            populateCertificatesTable(certificatesData);
        } else {
            throw new Error('Failed to load certificates data');
        }
        
    } catch (error) {
        console.error('Error loading certificates data:', error);
        showNotification('Error loading certificates data', 'error');
    } finally {
        showLoading(false);
    }
}

// Populate certificates table
function populateCertificatesTable(certificates) {
    const tbody = document.getElementById('certificatesTable');
    
    if (!certificates || certificates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No certificates found</td></tr>';
        return;
    }
    
    tbody.innerHTML = certificates.map(cert => `
        <tr>
            <td>
                <div style="font-weight: 600;">${cert.student_name}</div>
                <div style="font-size: 0.85rem; color: #6b7280;">${cert.register_number}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${cert.certificate_name}</div>
                <div style="font-size: 0.85rem; color: #6b7280;">${cert.certificate_type}</div>
            </td>
            <td>${cert.issuing_organization}</td>
            <td>${formatDate(cert.issue_date)}</td>
            <td>
                <span class="status-badge status-${cert.verification_status.toLowerCase()}">
                    ${cert.verification_status}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn" style="padding: 5px 8px; font-size: 0.75rem; background: #6366f1; color: white;" onclick="viewCertificate(${cert.cert_id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${cert.verification_status === 'Pending' ? 
                        `<button class="btn" style="padding: 5px 8px; font-size: 0.75rem; background: #059669; color: white;" onclick="verifyCertificate(${cert.cert_id})">
                            <i class="fas fa-check"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter certificates
function filterCertificates() {
    const searchTerm = document.getElementById('certificateSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredCertificates = certificatesData.filter(cert => {
        const matchesSearch = !searchTerm || 
            cert.certificate_name.toLowerCase().includes(searchTerm) ||
            cert.student_name.toLowerCase().includes(searchTerm) ||
            cert.issuing_organization.toLowerCase().includes(searchTerm);
            
        const matchesStatus = !statusFilter || cert.verification_status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    populateCertificatesTable(filteredCertificates);
}

// Populate create student form
async function populateCreateStudentForm() {
    try {
        // Load courses for dropdown
        const response = await fetch('/api/faculty/courses');
        if (response.ok) {
            coursesData = await response.json();
            populateCoursesDropdown();
        }
        
        populateBatchYearDropdown();
        
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

// Populate courses dropdown
function populateCoursesDropdown() {
    const courseSelect = document.getElementById('course');
    if (courseSelect && coursesData) {
        courseSelect.innerHTML = '<option value="">Select Course</option>' +
            coursesData.map(course => 
                `<option value="${course.course_id}">${course.course_name}</option>`
            ).join('');
    }
}

// Populate batch year dropdown
function populateBatchYearDropdown() {
    const batchSelect = document.getElementById('batchYear');
    if (batchSelect) {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 4; i <= currentYear + 1; i++) {
            years.push(i);
        }
        
        batchSelect.innerHTML = '<option value="">Select Batch Year</option>' +
            years.map(year => `<option value="${year}">${year}</option>`).join('');
    }
}

// Populate filters
function populateFilters() {
    // Course filter
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter && coursesData) {
        courseFilter.innerHTML = '<option value="">All Courses</option>' +
            coursesData.map(course => 
                `<option value="${course.course_id}">${course.course_name}</option>`
            ).join('');
    }
    
    // Batch filter
    const batchFilter = document.getElementById('batchFilter');
    if (batchFilter && studentsData) {
        const uniqueBatches = [...new Set(studentsData.map(s => s.batch_year))].sort();
        batchFilter.innerHTML = '<option value="">All Batches</option>' +
            uniqueBatches.map(batch => `<option value="${batch}">${batch}</option>`).join('');
    }
}

// Handle create student form submission
async function handleCreateStudent(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentData = Object.fromEntries(formData.entries());
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/faculty/create-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Student account created successfully!', 'success');
            resetCreateForm();
            // Refresh students data if we're on the students page
            if (document.getElementById('students').classList.contains('active')) {
                loadStudentsData();
            }
        } else {
            showNotification(result.message || 'Error creating student account', 'error');
        }
        
    } catch (error) {
        console.error('Error creating student:', error);
        showNotification('Error creating student account', 'error');
    } finally {
        showLoading(false);
    }
}

// View student details
async function viewStudent(studentId) {
    try {
        const response = await fetch(`/api/faculty/student/${studentId}`);
        if (response.ok) {
            const student = await response.json();
            showStudentModal(student);
        } else {
            showNotification('Error loading student details', 'error');
        }
    } catch (error) {
        console.error('Error viewing student:', error);
        showNotification('Error loading student details', 'error');
    }
}

// Show student modal
function showStudentModal(student) {
    const modal = document.getElementById('studentModal');
    const content = document.getElementById('studentModalContent');
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div>
                <h4 style="margin-bottom: 1rem; color: #1f2937;">Personal Information</h4>
                <div style="display: grid; gap: 0.5rem;">
                    <div><strong>Name:</strong> ${student.first_name} ${student.last_name}</div>
                    <div><strong>Register Number:</strong> ${student.register_number}</div>
                    <div><strong>Email:</strong> ${student.email}</div>
                    <div><strong>Phone:</strong> ${student.phone || 'N/A'}</div>
                    <div><strong>Date of Birth:</strong> ${formatDate(student.date_of_birth)}</div>
                    <div><strong>Gender:</strong> ${student.gender}</div>
                </div>
            </div>
            <div>
                <h4 style="margin-bottom: 1rem; color: #1f2937;">Academic Information</h4>
                <div style="display: grid; gap: 0.5rem;">
                    <div><strong>Course:</strong> ${student.course_name}</div>
                    <div><strong>Department:</strong> ${student.dept_name}</div>
                    <div><strong>Batch Year:</strong> ${student.batch_year}</div>
                    <div><strong>Current Semester:</strong> ${student.semester}</div>
                    <div><strong>CGPA:</strong> ${student.current_cgpa.toFixed(2)}</div>
                    <div><strong>Status:</strong> ${student.enrollment_status}</div>
                </div>
            </div>
        </div>
        <div style="margin-top: 1.5rem;">
            <h4 style="margin-bottom: 1rem; color: #1f2937;">Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">${student.total_certificates || 0}</div>
                    <div style="font-size: 0.9rem; color: #6b7280;">Certificates</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${student.verified_certificates || 0}</div>
                    <div style="font-size: 0.9rem; color: #6b7280;">Verified</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${(student.average_attendance || 0).toFixed(1)}%</div>
                    <div style="font-size: 0.9rem; color: #6b7280;">Attendance</div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Load reports data
async function loadReportsData() {
    try {
        const response = await fetch('/api/faculty/reports');
        if (response.ok) {
            const reports = await response.json();
            updateReports(reports);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Update reports
function updateReports(reports) {
    // Department statistics
    const deptStats = document.getElementById('departmentStats');
    if (deptStats && reports.departmentStats) {
        deptStats.innerHTML = reports.departmentStats.map(dept => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${dept.dept_name}</span>
                <strong>${dept.student_count}</strong>
            </div>
        `).join('');
    }
    
    // CGPA distribution
    const cgpaDistribution = document.getElementById('cgpaDistribution');
    if (cgpaDistribution && reports.cgpaDistribution) {
        cgpaDistribution.innerHTML = Object.entries(reports.cgpaDistribution).map(([range, count]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${range}</span>
                <strong>${count}</strong>
            </div>
        `).join('');
    }
    
    // Certificate analytics
    const certAnalytics = document.getElementById('certificateAnalytics');
    if (certAnalytics && reports.certificateAnalytics) {
        certAnalytics.innerHTML = Object.entries(reports.certificateAnalytics).map(([status, count]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${status}</span>
                <strong>${count}</strong>
            </div>
        `).join('');
    }
}

// Utility functions
function resetCreateForm() {
    document.getElementById('createStudentForm').reset();
    document.getElementById('defaultPassword').value = 'student123';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function showLoading(show) {
    // Implementation for loading state
    console.log('Loading:', show);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#059669',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Refresh functions
function refreshDashboard() {
    loadDashboardData();
}

function refreshCertificates() {
    loadCertificatesData();
}

// Certificate verification function
async function verifyCertificate(certId) {
    try {
        const response = await fetch(`/api/faculty/verify-certificate/${certId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Certificate verified successfully!', 'success');
            loadCertificatesData();
        } else {
            showNotification('Error verifying certificate', 'error');
        }
    } catch (error) {
        console.error('Error verifying certificate:', error);
        showNotification('Error verifying certificate', 'error');
    }
}

// Profile and logout functions
function showProfile() {
    alert(`Profile Information:
    
Name: ${currentUser.firstName} ${currentUser.lastName}
Username: ${currentUser.username}
Email: ${currentUser.email}
Role: ${currentUser.userType}
Employee ID: ${currentUser.employeeId || 'N/A'}
Designation: ${currentUser.designation || 'N/A'}`);
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const response = await fetch('/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                window.location.href = '/login';
            } else {
                showNotification('Error logging out', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }
}

// Export and report functions
function exportStudentData() {
    showNotification('Export functionality will be implemented soon', 'info');
}

function generateBatchReport() {
    showNotification('Report generation functionality will be implemented soon', 'info');
}

function viewCertificate(certId) {
    showNotification('Certificate viewer will be implemented soon', 'info');
}