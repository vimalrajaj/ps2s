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
        case 'courses':
            loadMyCourses();
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
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
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