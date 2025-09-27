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

    // Filters
    const classFilter = document.getElementById('classFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (classFilter) classFilter.addEventListener('change', filterStudents);
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
            loadMyStudents();
            break;
        case 'academic-performance':
            loadAcademicPerformance();
            break;
        case 'upload-marks':
            loadUploadMarks();
            break;
        case 'certificates':
            loadCertificatesData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
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
        
        // Load initial data for all sections
        await Promise.all([
            loadMyStudents(),
            loadMyCourses(),
            loadCertificatesData()
        ]);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load faculty's students
async function loadMyStudents() {
    try {
        const response = await fetch('/api/faculty/my-students');
        if (response.ok) {
            const students = await response.json();
            studentsData = students;
            updateStudentsTable(students);
            updateClassFilter(students);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Load faculty's courses/classes
async function loadMyCourses() {
    try {
        const response = await fetch('/api/faculty/my-classes');
        if (response.ok) {
            const courses = await response.json();
            coursesData = courses;
            updateCoursesTable(courses);
            updateCourseStats(courses);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Update course statistics in dashboard
function updateCourseStats(courses) {
    const totalClasses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.current_students || 0), 0);
    const uniqueCourses = new Set(courses.map(c => c.course_id)).size;
    
    // Update dashboard stats
    const totalClassesEl = document.getElementById('totalClasses');
    const totalStudentsInClassesEl = document.getElementById('totalStudentsInClasses');
    const totalCoursesEl = document.getElementById('totalCourses');
    
    if (totalClassesEl) totalClassesEl.textContent = totalClasses;
    if (totalStudentsInClassesEl) totalStudentsInClassesEl.textContent = totalStudents;
    if (totalCoursesEl) totalCoursesEl.textContent = uniqueCourses;
}

// Update courses table
function updateCoursesTable(courses) {
    const tbody = document.getElementById('coursesTable');
    if (!tbody) return;

    tbody.innerHTML = courses.map(course => `
        <tr>
            <td><strong>${course.class_name}</strong></td>
            <td>${course.course_name}</td>
            <td>${course.dept_name || 'N/A'}</td>
            <td>${course.current_students}/${course.max_students}</td>
            <td>${course.year_name}</td>
            <td>Semester ${course.current_semester}</td>
            <td>
                <button class="btn" style="background: #e5e7eb; color: #374151; padding: 5px 10px;" 
                        onclick="viewClassDetails(${course.class_id})">
                    <i class="fas fa-eye"></i> View Students
                </button>
            </td>
        </tr>
    `).join('');
}

// Update class filter dropdown
function updateClassFilter(students) {
    const classFilter = document.getElementById('classFilter');
    if (classFilter && students.length > 0) {
        const uniqueClasses = [...new Set(students.map(s => ({ id: s.class_id, name: s.class_name })))];
        classFilter.innerHTML = '<option value="">All Classes</option>' +
            uniqueClasses.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
    }
}

// Update students table with faculty's students
function updateStudentsTable(students) {
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6b7280;">No students assigned to your classes</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user" style="color: #6b7280;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600;">${student.first_name} ${student.last_name}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">${student.email}</div>
                    </div>
                </div>
            </td>
            <td><strong>${student.register_number}</strong></td>
            <td>${student.class_name}</td>
            <td>${student.course_name}</td>
            <td>
                <span style="font-weight: 600; color: ${student.current_cgpa >= 8.5 ? '#059669' : student.current_cgpa >= 7.0 ? '#f59e0b' : '#dc2626'};">
                    ${student.current_cgpa ? student.current_cgpa.toFixed(2) : 'N/A'}
                </span>
            </td>
            <td>
                <span class="status-badge status-${student.enrollment_status.toLowerCase()}">
                    ${student.enrollment_status}
                </span>
            </td>
            <td>
                <button class="btn" style="background: #e5e7eb; color: #374151; padding: 5px 10px;" 
                        onclick="viewStudentDetails(${student.student_id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

// View class details function
function viewClassDetails(classId) {
    // Filter students by class
    const classStudents = studentsData.filter(s => s.class_id == classId);
    if (classStudents.length > 0) {
        showStudentModal({
            title: `Students in ${classStudents[0].class_name}`,
            students: classStudents
        });
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

// View student details
async function viewStudentDetails(studentId) {
    try {
        const student = studentsData.find(s => s.student_id == studentId);
        if (student) {
            showStudentModal(student);
        } else {
            showNotification('Student not found', 'error');
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
        <div class="student-details">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user" style="color: #6b7280; font-size: 1.5rem;"></i>
                </div>
                <div>
                    <h4>${student.first_name} ${student.last_name}</h4>
                    <p style="color: #6b7280; margin: 0;">${student.email}</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <label style="font-weight: 600; color: #374151;">Register Number:</label>
                    <p>${student.register_number}</p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">Class:</label>
                    <p>${student.class_name || 'N/A'}</p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">Course:</label>
                    <p>${student.course_name || 'N/A'}</p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">Department:</label>
                    <p>${student.dept_name || 'N/A'}</p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">CGPA:</label>
                    <p style="font-weight: 600; color: ${student.current_cgpa >= 8.5 ? '#059669' : student.current_cgpa >= 7.0 ? '#f59e0b' : '#dc2626'};">
                        ${student.current_cgpa ? student.current_cgpa.toFixed(2) : 'N/A'}
                    </p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">Certificates:</label>
                    <p>${student.total_certificates || 0}</p>
                </div>
                <div>
                    <label style="font-weight: 600; color: #374151;">Status:</label>
                    <p>
                        <span class="status-badge status-${student.enrollment_status.toLowerCase()}">
                            ${student.enrollment_status}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load certificates data
async function loadCertificatesData() {
    try {
        const response = await fetch('/api/faculty/certificates');
        if (response.ok) {
            certificatesData = await response.json();
            updateCertificatesTable(certificatesData);
        }
    } catch (error) {
        console.error('Error loading certificates:', error);
    }
}

// Update certificates table
function updateCertificatesTable(certificates) {
    const tbody = document.getElementById('certificatesTable');
    if (!tbody) return;

    if (!certificates || certificates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No certificates found</td></tr>';
        return;
    }

    tbody.innerHTML = certificates.map(cert => `
        <tr>
            <td>${cert.student_name}</td>
            <td>${cert.certificate_name}</td>
            <td>${cert.issuing_organization}</td>
            <td>${formatDate(cert.issue_date)}</td>
            <td>
                <span class="status-badge status-${cert.verification_status.toLowerCase()}">
                    ${cert.verification_status}
                </span>
            </td>
            <td>
                ${cert.verification_status === 'Pending' ? 
                    `<button class="btn btn-primary" onclick="verifyCertificate(${cert.cert_id})">
                        <i class="fas fa-check"></i> Verify
                    </button>` : 
                    '<span style="color: #6b7280;">Verified</span>'
                }
            </td>
        </tr>
    `).join('');
}

// Load reports data
async function loadReportsData() {
    try {
        const response = await fetch('/api/faculty/reports');
        if (response.ok) {
            const reports = await response.json();
            updateReportsSection(reports);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Update reports section
function updateReportsSection(reports) {
    // Update department stats
    const deptStats = document.getElementById('departmentStats');
    if (deptStats && reports.departmentStats) {
        deptStats.innerHTML = reports.departmentStats.map(dept => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${dept.dept_name}</span>
                <strong>${dept.student_count}</strong>
            </div>
        `).join('');
    }

    // Update CGPA distribution
    const cgpaDistribution = document.getElementById('cgpaDistribution');
    if (cgpaDistribution && reports.cgpaDistribution) {
        cgpaDistribution.innerHTML = Object.entries(reports.cgpaDistribution).map(([range, count]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${range}</span>
                <strong>${count}</strong>
            </div>
        `).join('');
    }

    // Update certificate analytics
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

// Filter functions
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    
    let filteredStudents = studentsData;
    
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(student => 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.register_number.toLowerCase().includes(searchTerm)
        );
    }
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => 
            student.class_id == classFilter
        );
    }
    
    updateStudentsTable(filteredStudents);
}

function filterCertificates() {
    const searchTerm = document.getElementById('certificateSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredCertificates = certificatesData;
    
    if (searchTerm) {
        filteredCertificates = filteredCertificates.filter(cert => 
            cert.student_name.toLowerCase().includes(searchTerm) ||
            cert.certificate_name.toLowerCase().includes(searchTerm) ||
            cert.issuing_organization.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filteredCertificates = filteredCertificates.filter(cert => 
            cert.verification_status === statusFilter
        );
    }
    
    updateCertificatesTable(filteredCertificates);
}

// Verify certificate
async function verifyCertificate(certId) {
    try {
        const response = await fetch(`/api/faculty/verify-certificate/${certId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Certificate verified successfully!', 'success');
            loadCertificatesData(); // Refresh data
        } else {
            showNotification('Error verifying certificate', 'error');
        }
    } catch (error) {
        console.error('Error verifying certificate:', error);
        showNotification('Error verifying certificate', 'error');
    }
}

// Refresh functions
function refreshDashboard() {
    loadDashboardData();
}

function refreshStudentData() {
    loadMyStudents();
}

function refreshCertificates() {
    loadCertificatesData();
}

// Export functions
function exportStudentData() {
    if (!studentsData || studentsData.length === 0) {
        showNotification('No student data to export', 'error');
        return;
    }
    
    const csvContent = convertToCSV(studentsData);
    downloadCSV(csvContent, 'students_data.csv');
}

function generateBatchReport() {
    showNotification('Batch report generation feature coming soon!', 'info');
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with toast notifications
    alert(message);
}

function showLoading(show) {
    // Simple loading implementation - can be enhanced
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Redirect to login page
                    window.location.href = data.redirectUrl || '/login';
                } else {
                    // Fallback - redirect to login anyway
                    window.location.href = '/login';
                }
            } else {
                // Fallback - redirect to login anyway
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback - redirect to login anyway
            window.location.href = '/login';
        }
    }
}

// Profile function
function showProfile() {
    loadProfileData();
}

// Load and display profile data
async function loadProfileData() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayProfileModal(data.profile);
            } else {
                showNotification('Error loading profile: ' + data.message, 'error');
            }
        } else {
            showNotification('Error loading profile', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Display profile in a modal
function displayProfileModal(profile) {
    const modalHtml = `
        <div class="modal fade" id="profileModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Faculty Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Personal Information</h6>
                                <p><strong>Name:</strong> ${profile.first_name} ${profile.last_name}</p>
                                <p><strong>Faculty Code:</strong> ${profile.faculty_code}</p>
                                <p><strong>Email:</strong> ${profile.email}</p>
                                <p><strong>Phone:</strong> ${profile.phone || 'Not provided'}</p>
                                <p><strong>Gender:</strong> ${profile.gender || 'Not provided'}</p>
                                <p><strong>Date of Birth:</strong> ${profile.date_of_birth || 'Not provided'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Professional Information</h6>
                                <p><strong>Department:</strong> ${profile.dept_name}</p>
                                <p><strong>Designation:</strong> ${profile.designation}</p>
                                <p><strong>Qualification:</strong> ${profile.qualification || 'Not provided'}</p>
                                <p><strong>Experience:</strong> ${profile.experience_years || 0} years</p>
                                <p><strong>Date of Joining:</strong> ${profile.date_of_joining || 'Not provided'}</p>
                                <p><strong>Mentor Class:</strong> ${profile.mentor_class || 'Not assigned'}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Change Password</h6>
                                <form id="changePasswordForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="currentPassword" class="form-label">Current Password</label>
                                                <input type="password" class="form-control" id="currentPassword" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="newPassword" class="form-label">New Password</label>
                                                <input type="password" class="form-control" id="newPassword" required>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Change Password</button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('profileModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();

    // Add event listener for password change form
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!currentPassword || !newPassword) {
        showNotification('Please fill in both password fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters long', 'error');
        return;
    }

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Password changed successfully', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            showNotification(data.message || 'Error changing password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error changing password', 'error');
    }
}

// Academic Performance Management Functions
let selectedAcademicYear = null;
let selectedSemester = null;

// Load academic performance section
async function loadAcademicPerformance() {
    try {
        console.log('🎓 Loading academic years...');
        // Load academic years
        const response = await fetch('/api/faculty/academic-years');
        console.log('🎓 Academic years response:', response.status);
        
        if (response.ok) {
            const academicYears = await response.json();
            console.log('🎓 Academic years data:', academicYears);
            updateAcademicYearDropdown(academicYears);
        } else {
            console.error('❌ Academic years response not ok:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
        
        // Reset form
        document.getElementById('academicSelectionForm').style.display = 'block';
        document.getElementById('performanceManagementContainer').style.display = 'none';
    } catch (error) {
        console.error('Error loading academic performance:', error);
    }
}

// Update academic year dropdown
function updateAcademicYearDropdown(academicYears) {
    console.log('🎓 Updating dropdown with data:', academicYears);
    const select = document.getElementById('academicYearSelect');
    
    if (!select) {
        console.error('❌ Academic year select element not found!');
        return;
    }
    
    select.innerHTML = '<option value="">Select Academic Year</option>';
    
    if (!academicYears || academicYears.length === 0) {
        console.warn('⚠️ No academic years data received');
        return;
    }
    
    academicYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year.id;
        option.textContent = year.year_name;
        select.appendChild(option);
        console.log('🎓 Added option:', year.year_name);
    });
    
    console.log('🎓 Dropdown updated with', academicYears.length, 'options');
}

// Proceed to performance management
async function proceedToPerformanceManagement() {
    const academicYearId = document.getElementById('academicYearSelect').value;
    const semester = document.getElementById('semesterSelect').value;
    
    if (!academicYearId || !semester) {
        showNotification('Please select both academic year and semester', 'error');
        return;
    }
    
    selectedAcademicYear = academicYearId;
    selectedSemester = semester;
    
    try {
        // Get the selected academic year text for API call
        const academicYearSelect = document.getElementById('academicYearSelect');
        const academicYearValue = academicYearSelect.options[academicYearSelect.selectedIndex].text;
        
        // Load subjects for the selected semester and academic year
        const response = await fetch(`/api/faculty/subjects?semester=${semester}&academic_year=${encodeURIComponent(academicYearValue)}`);
        if (response.ok) {
            const subjects = await response.json();
            updateSubjectDropdowns(subjects);
        }
        
        // Show performance management interface
        document.getElementById('academicSelectionForm').style.display = 'none';
        document.getElementById('performanceManagementContainer').style.display = 'block';
        
        // Load existing IAs
        loadExistingIAs();
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('Error loading subjects', 'error');
    }
}

// Update subject dropdowns
function updateSubjectDropdowns(subjects) {
    const addSubjectSelect = document.getElementById('subjectSelect');
    const filterSubjectSelect = document.getElementById('subjectSelectFilter');
    
    // Clear existing options
    addSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
    filterSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    subjects.forEach(subject => {
        const option1 = document.createElement('option');
        option1.value = subject.subject_id;
        option1.textContent = `${subject.subject_name} (${subject.subject_code})`;
        addSubjectSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = subject.subject_id;
        option2.textContent = `${subject.subject_name} (${subject.subject_code})`;
        filterSubjectSelect.appendChild(option2);
    });
}

// Add internal assessment
async function addInternalAssessment() {
    const iaNumber = document.getElementById('iaNumberInput').value;
    const subjectId = document.getElementById('subjectSelect').value;
    
    if (!iaNumber || !subjectId) {
        showNotification('Please select both IA number and subject', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/faculty/add-internal-assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                iaNumber: parseInt(iaNumber),
                subjectId: parseInt(subjectId),
                academicYearId: parseInt(selectedAcademicYear),
                semester: parseInt(selectedSemester)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Internal Assessment added successfully', 'success');
            // Reset form
            document.getElementById('iaNumberInput').value = '';
            document.getElementById('subjectSelect').value = '';
            // Reload existing IAs
            loadExistingIAs();
        } else {
            showNotification(data.message || 'Error adding Internal Assessment', 'error');
        }
    } catch (error) {
        console.error('Error adding IA:', error);
        showNotification('Error adding Internal Assessment', 'error');
    }
}

// Load existing IAs for filter dropdowns
async function loadExistingIAs() {
    try {
        const response = await fetch(`/api/faculty/internal-assessments?academicYearId=${selectedAcademicYear}&semester=${selectedSemester}`);
        if (response.ok) {
            const ias = await response.json();
            updateIAFilterDropdowns(ias);
        }
    } catch (error) {
        console.error('Error loading existing IAs:', error);
    }
}

// Update IA filter dropdowns
function updateIAFilterDropdowns(ias) {
    const iaSelect = document.getElementById('iaSelectFilter');
    iaSelect.innerHTML = '<option value="">Select IA</option>';
    
    // Get unique IA numbers
    const uniqueIAs = [...new Set(ias.map(ia => ia.ia_number))];
    uniqueIAs.forEach(iaNum => {
        const option = document.createElement('option');
        option.value = iaNum;
        option.textContent = `IA ${iaNum}`;
        iaSelect.appendChild(option);
    });
}

// Load student marks for selected IA and subject
async function loadStudentMarks() {
    const iaNumber = document.getElementById('iaSelectFilter').value;
    const subjectId = document.getElementById('subjectSelectFilter').value;
    
    if (!iaNumber || !subjectId) {
        showNotification('Please select both IA number and subject', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/faculty/student-marks?iaNumber=${iaNumber}&subjectId=${subjectId}&academicYearId=${selectedAcademicYear}&semester=${selectedSemester}`);
        if (response.ok) {
            const data = await response.json();
            displayStudentMarks(data.students, data.subjectName, iaNumber);
        } else {
            showNotification('Error loading student marks', 'error');
        }
    } catch (error) {
        console.error('Error loading student marks:', error);
        showNotification('Error loading student marks', 'error');
    }
}

// Display student marks in table
function displayStudentMarks(students, subjectName, iaNumber) {
    const container = document.getElementById('studentMarksContainer');
    const tableTitle = document.getElementById('marksTableTitle');
    const tbody = document.getElementById('studentMarksTable');
    
    tableTitle.textContent = `IA ${iaNumber} - ${subjectName}`;
    
    tbody.innerHTML = students.map((student, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.register_number}</td>
            <td>
                <input type="number" 
                       class="form-input" 
                       style="width: 100px; padding: 5px;" 
                       min="0" 
                       max="20" 
                       step="0.5"
                       value="${student.marks_obtained || 0}"
                       data-student-id="${student.student_id}"
                       data-ia-id="${student.internal_assessment_id}"
                       onchange="updateMarks(this)">
            </td>
            <td>
                <select class="form-select" 
                        style="width: 120px; padding: 5px;"
                        data-student-id="${student.student_id}"
                        data-ia-id="${student.internal_assessment_id}"
                        onchange="updateAttendance(this)">
                    <option value="Present" ${student.attendance_status === 'Present' ? 'selected' : ''}>Present</option>
                    <option value="Absent" ${student.attendance_status === 'Absent' ? 'selected' : ''}>Absent</option>
                </select>
            </td>
            <td>
                <input type="text" 
                       class="form-input" 
                       style="width: 150px; padding: 5px;" 
                       placeholder="Remarks"
                       value="${student.remarks || ''}"
                       data-student-id="${student.student_id}"
                       data-ia-id="${student.internal_assessment_id}"
                       onchange="updateRemarks(this)">
            </td>
        </tr>
    `).join('');
    
    container.style.display = 'block';
}

// Update marks
function updateMarks(input) {
    const marks = parseFloat(input.value) || 0;
    if (marks < 0 || marks > 20) {
        showNotification('Marks should be between 0 and 20', 'error');
        input.value = Math.max(0, Math.min(20, marks));
    }
}

// Update attendance
function updateAttendance(select) {
    // Logic handled in saveAllMarks function
}

// Update remarks
function updateRemarks(input) {
    // Logic handled in saveAllMarks function
}

// Save all marks
async function saveAllMarks() {
    const tbody = document.getElementById('studentMarksTable');
    const rows = tbody.querySelectorAll('tr');
    const marksData = [];
    
    rows.forEach(row => {
        const marksInput = row.querySelector('input[type="number"]');
        const attendanceSelect = row.querySelector('select');
        const remarksInput = row.querySelector('input[type="text"]');
        
        if (marksInput && attendanceSelect) {
            marksData.push({
                studentId: parseInt(marksInput.dataset.studentId),
                internalAssessmentId: parseInt(marksInput.dataset.iaId),
                marksObtained: parseFloat(marksInput.value) || 0,
                attendanceStatus: attendanceSelect.value,
                remarks: remarksInput.value || null
            });
        }
    });
    
    try {
        const response = await fetch('/api/faculty/save-student-marks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ marksData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('All marks saved successfully', 'success');
        } else {
            showNotification(data.message || 'Error saving marks', 'error');
        }
    } catch (error) {
        console.error('Error saving marks:', error);
        showNotification('Error saving marks', 'error');
    }
}

// =================================
// Upload Marks Functions
// =================================

// Load upload marks section
async function loadUploadMarks() {
    console.log('📤 Loading Upload Marks section');
    // Reset upload form
    document.getElementById('marksFile').value = '';
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('uploadResults').style.display = 'none';
}

// Validate selected file
function validateFile(input) {
    const file = input.files[0];
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
            uploadBtn.disabled = false;
            showNotification(`${fileExtension.toUpperCase()} file selected successfully`, 'success');
        } else {
            uploadBtn.disabled = true;
            showNotification('Please select a valid file (.xlsx, .xls, or .csv)', 'error');
            input.value = '';
        }
    } else {
        uploadBtn.disabled = true;
    }
}

// Download sample file (CSV or Excel)
function downloadSampleFile(format = 'csv') {
    if (format === 'excel') {
        // Download Excel file from server
        const a = document.createElement('a');
        a.href = '/sample_marks_upload.xlsx';
        a.download = 'sample_marks_upload.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('Excel sample file downloaded successfully', 'success');
    } else {
        // Create CSV sample data
        const sampleData = [
            ['Academic Year', 'Semester', 'IA', 'Subject', 'Subject Code', 'Student ID', 'Student Name', 'Marks'],
            ['2024-25', '1', '1', 'Mathematics for Computer Science', 'CSE102', '141', 'sanjay v', '18'],
            ['2024-25', '1', '1', 'Mathematics for Computer Science', 'CSE102', '123', 'xyx d', '16'],
            ['2024-25', '1', '1', 'Mathematics for Computer Science', 'CSE102', '182', 'vimal javakumar', '19'],
            ['2024-25', '1', '1', 'Programming Fundamentals', 'CSE101', '141', 'sanjay v', '17'],
            ['2024-25', '1', '1', 'Programming Fundamentals', 'CSE101', '123', 'xyx d', '15'],
            ['2024-25', '1', '1', 'Programming Fundamentals', 'CSE101', '182', 'vimal javakumar', '20']
        ];
        
        // Convert to CSV format
        const csvContent = sampleData.map(row => row.join(',')).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_marks_upload.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('CSV sample file downloaded successfully', 'success');
    }
}

// Upload marks file
async function uploadMarksFile() {
    const fileInput = document.getElementById('marksFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file first', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('marksFile', file);
    
    try {
        showNotification('Uploading file...', 'info');
        
        const response = await fetch('/api/faculty/upload-marks', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('File uploaded successfully', 'success');
            displayUploadResults(data.results);
        } else {
            showNotification(data.message || 'Error uploading file', 'error');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('Error uploading file', 'error');
    }
}

// Display upload results
function displayUploadResults(results) {
    const uploadResults = document.getElementById('uploadResults');
    const uploadMessage = document.getElementById('uploadMessage');
    const summaryTableBody = document.getElementById('uploadSummaryTableBody');
    
    uploadResults.style.display = 'block';
    
    // Show upload statistics
    uploadMessage.innerHTML = `
        <div class="alert alert-success">
            <strong>Upload Successful!</strong><br>
            Total Records: ${results.totalRecords}<br>
            Successfully Processed: ${results.successCount}<br>
            Errors: ${results.errorCount}
        </div>
    `;
    
    // Group data by Academic Year, Semester, IA, and Subject
    const groupedData = {};
    results.processedData.forEach(record => {
        const key = `${record.academicYear}-${record.semester}-${record.ia}-${record.subject}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                academicYear: record.academicYear,
                semester: record.semester,
                ia: record.ia,
                subject: record.subject,
                subjectCode: record.subjectCode,
                students: []
            };
        }
        groupedData[key].students.push({
            studentId: record.studentId,
            studentName: record.studentName,
            marks: record.marks,
            status: record.status || 'Success'
        });
    });
    
    // Populate summary table
    summaryTableBody.innerHTML = '';
    Object.values(groupedData).forEach((group, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${group.academicYear}</td>
            <td>${group.semester}</td>
            <td>IA ${group.ia}</td>
            <td>${group.subject} (${group.subjectCode})</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showDetailedView(${index}, '${group.subject}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </td>
        `;
        summaryTableBody.appendChild(row);
    });
    
    // Store grouped data for detailed view
    window.uploadedGroupedData = Object.values(groupedData);
}

// Show detailed view
function showDetailedView(groupIndex, subjectName) {
    const detailedView = document.getElementById('detailedView');
    const detailedTableBody = document.getElementById('detailedMarksTableBody');
    const group = window.uploadedGroupedData[groupIndex];
    
    detailedView.style.display = 'block';
    
    // Update heading
    detailedView.querySelector('h6').textContent = `Student Marks Details - ${subjectName}`;
    
    // Populate detailed table
    detailedTableBody.innerHTML = '';
    group.students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.studentId}</td>
            <td>${student.studentName}</td>
            <td>${student.marks}</td>
            <td>
                <span class="badge ${student.status === 'Success' ? 'bg-success' : 'bg-danger'}">
                    ${student.status}
                </span>
            </td>
        `;
        detailedTableBody.appendChild(row);
    });
    
    // Scroll to detailed view
    detailedView.scrollIntoView({ behavior: 'smooth' });
}