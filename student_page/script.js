// Global variables
let currentSection = 'dashboard';
let currentUser = null;
let studentData = null;
let isInitializing = false; // Prevent multiple initialization attempts

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const notificationDropdown = document.getElementById('notificationDropdown');
const profileDropdown = document.getElementById('profileDropdown');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!isInitializing) {
        isInitializing = true;
        console.log('DOM loaded, starting dashboard initialization...');
        initializeDashboard();
    } else {
        console.log('Initialization already in progress, skipping...');
    }
});

// Initialize dashboard with authentication check
async function initializeDashboard() {
    try {
        console.log('Starting dashboard initialization...');
        
        // Simple authentication check without complex retry logic
        const response = await fetch('/api/user-profile');
        console.log('Auth response status:', response.status, 'OK:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Auth response data:', data);
            
            if (data.success && data.user) {
                console.log('Authentication successful, user:', data.user.username);
                currentUser = data.user;
                
                // Load dashboard components with individual error handling
                try {
                    await loadStudentData();
                    console.log('✅ Student data loaded');
                } catch (error) {
                    console.error('❌ Error loading student data:', error);
                }
                
                try {
                    initializeEventListeners();
                    console.log('✅ Event listeners initialized');
                } catch (error) {
                    console.error('❌ Error initializing event listeners:', error);
                }
                
                try {
                    showSection('dashboard');
                    console.log('✅ Dashboard section shown');
                } catch (error) {
                    console.error('❌ Error showing dashboard section:', error);
                }
                
                try {
                    initializeCharts();
                    console.log('✅ Charts initialized');
                } catch (error) {
                    console.error('❌ Error initializing charts:', error);
                }
                
                try {
                    updateNotificationBadge();
                    console.log('✅ Notification badge updated');
                } catch (error) {
                    console.error('❌ Error updating notification badge:', error);
                }
                
                try {
                    updateUserInterface();
                    console.log('✅ User interface updated');
                } catch (error) {
                    console.error('❌ Error updating user interface:', error);
                }
                
                console.log('Dashboard initialization completed successfully');
                return; // Success - exit function
            } else {
                console.log('Authentication failed - no success or user in response');
            }
        } else {
            console.log('Authentication failed - HTTP status:', response.status);
        }
        
        // Only redirect if authentication definitively failed
        console.log('Redirecting to login due to authentication failure');
        window.location.href = '/login';
        
    } catch (error) {
        console.error('Error during dashboard initialization:', error);
        window.location.href = '/login';
    }
}

// Load student data from database
async function loadStudentData() {
    try {
        const response = await fetch('/api/student-data');
        if (response.ok) {
            studentData = await response.json();
            console.log('Student data loaded:', studentData);
        } else {
            throw new Error('Failed to load student data');
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        showToast('Error loading student data', 'error');
    }
}

// Update user interface with real data
function updateUserInterface() {
    if (!currentUser || !studentData) return;
    
    // Update header with student name
    const welcomeElements = document.querySelectorAll('[id*="welcome"], .user-name, .profile-name');
    const studentName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    
    welcomeElements.forEach(element => {
        if (element.textContent.includes('welcome') || element.textContent.includes('Welcome')) {
            element.textContent = `Welcome back, ${studentName}`;
        } else {
            element.textContent = studentName;
        }
    });
    
    // Update profile information in dropdown
    const profileInfo = document.querySelector('.profile-info');
    if (profileInfo) {
        profileInfo.innerHTML = `
            <div class="profile-details">
                <div class="profile-name">${studentName}</div>
                <div class="profile-id">${currentUser.registerNumber}</div>
                <div class="profile-course">${studentData.student?.course_name || 'Student'}</div>
            </div>
        `;
    }
    
    // Update dashboard stats with real data
    updateDashboardStats();
    
    // Update profile image if available
    const profileImages = document.querySelectorAll('.profile-img, .user-avatar');
    profileImages.forEach(img => {
        if (currentUser.profileImage) {
            img.style.backgroundImage = `url(${currentUser.profileImage})`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center';
        }
    });
}

// Update dashboard statistics with real data
function updateDashboardStats() {
    if (!studentData || !studentData.student) return;
    
    const student = studentData.student;
    
    // Update CGPA
    const cgpaElements = document.querySelectorAll('[data-stat="cgpa"], .cgpa-value');
    cgpaElements.forEach(el => {
        el.textContent = student.current_cgpa ? student.current_cgpa.toFixed(2) : '0.00';
    });
    
    // Update certificates count
    const certElements = document.querySelectorAll('[data-stat="certificates"], .cert-count');
    certElements.forEach(el => {
        el.textContent = student.total_certificates || 0;
    });
    
    // Update verified certificates
    const verifiedElements = document.querySelectorAll('[data-stat="verified"], .verified-count');
    verifiedElements.forEach(el => {
        el.textContent = student.verified_certificates || 0;
    });
    
    // Update attendance
    const attendanceElements = document.querySelectorAll('[data-stat="attendance"], .attendance-value');
    attendanceElements.forEach(el => {
        const attendance = student.average_attendance || 0;
        el.textContent = `${attendance.toFixed(1)}%`;
    });
    
    // Update semester and course info
    const semesterElements = document.querySelectorAll('[data-info="semester"]');
    semesterElements.forEach(el => {
        el.textContent = `Semester ${student.semester || 1}`;
    });
    
    const courseElements = document.querySelectorAll('[data-info="course"]');
    courseElements.forEach(el => {
        el.textContent = student.course_name || 'Course';
    });
    
    // Update batch year
    const batchElements = document.querySelectorAll('[data-info="batch"]');
    batchElements.forEach(el => {
        el.textContent = `Batch ${student.batch_year || new Date().getFullYear()}`;
    });
}

// Event Listeners
function initializeEventListeners() {
    // Sidebar menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.notification-icon') && !event.target.closest('.notification-dropdown')) {
            notificationDropdown.classList.remove('active');
        }
        if (!event.target.closest('.profile-img') && !event.target.closest('.profile-dropdown')) {
            profileDropdown.classList.remove('active');
        }
    });

    // Notification items click
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('unread');
            updateNotificationBadge();
        });
    });

    // Mark all notifications as read
    document.querySelector('.mark-all-read').addEventListener('click', function() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        updateNotificationBadge();
    });
}

// Navigation Functions
function showSection(sectionId) {
    // Update menu items
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    // Update content sections
    contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    currentSection = sectionId;

    // Load section-specific content
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'progress':
            loadProgressData();
            break;
        case 'attendance':
            loadAttendanceData();
            break;
        case 'academic':
            loadAcademicData();
            break;
        case 'certificates':
            loadCertificatesData();
            break;
        case 'portfolio':
            loadPortfolioData();
            break;
    }
}

// Dropdown Functions
function toggleNotifications() {
    notificationDropdown.classList.toggle('active');
    profileDropdown.classList.remove('active');
}

function toggleProfileMenu() {
    profileDropdown.classList.toggle('active');
    notificationDropdown.classList.remove('active');
}

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Profile Menu Functions
function showProfile() {
    loadStudentProfile();
}

// Load and display student profile
async function loadStudentProfile() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayStudentProfileModal(data.profile);
            } else {
                showAlert('Error loading profile: ' + data.message, 'error');
            }
        } else {
            showAlert('Error loading profile', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile', 'error');
    }
    profileDropdown.classList.remove('active');
}

// Display student profile in a modal
function displayStudentProfileModal(profile) {
    const modalHtml = `
        <div class="modal fade" id="studentProfileModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Student Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Personal Information</h6>
                                <p><strong>Name:</strong> ${profile.first_name} ${profile.last_name}</p>
                                <p><strong>Register Number:</strong> ${profile.register_number}</p>
                                <p><strong>Email:</strong> ${profile.email}</p>
                                <p><strong>Phone:</strong> ${profile.phone || 'Not provided'}</p>
                                <p><strong>Gender:</strong> ${profile.gender || 'Not provided'}</p>
                                <p><strong>Date of Birth:</strong> ${profile.date_of_birth || 'Not provided'}</p>
                                <p><strong>Address:</strong> ${profile.address || 'Not provided'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Academic Information</h6>
                                <p><strong>Course:</strong> ${profile.course_name}</p>
                                <p><strong>Department:</strong> ${profile.dept_name}</p>
                                <p><strong>Class:</strong> ${profile.class_name}</p>
                                <p><strong>Academic Year:</strong> ${profile.year_name}</p>
                                <p><strong>Current Semester:</strong> ${profile.current_semester}</p>
                                <p><strong>Current Year:</strong> ${profile.current_year}</p>
                                <p><strong>Current CGPA:</strong> ${profile.current_cgpa || '0.00'}</p>
                                <p><strong>Mentor:</strong> ${profile.mentor_name || 'Not assigned'}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Parent Information</h6>
                                <p><strong>Parent Name:</strong> ${profile.parent_name || 'Not provided'}</p>
                                <p><strong>Parent Phone:</strong> ${profile.parent_phone || 'Not provided'}</p>
                                <p><strong>Parent Email:</strong> ${profile.parent_email || 'Not provided'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Other Information</h6>
                                <p><strong>Admission Date:</strong> ${profile.admission_date || 'Not provided'}</p>
                                <p><strong>Enrollment Status:</strong> ${profile.enrollment_status}</p>
                                <p><strong>Total Credits:</strong> ${profile.total_credits || 0}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6>Change Password</h6>
                                <form id="studentChangePasswordForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="studentCurrentPassword" class="form-label">Current Password</label>
                                                <input type="password" class="form-control" id="studentCurrentPassword" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="studentNewPassword" class="form-label">New Password</label>
                                                <input type="password" class="form-control" id="studentNewPassword" required>
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
    const existingModal = document.getElementById('studentProfileModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('studentProfileModal'));
    modal.show();

    // Add event listener for password change form
    document.getElementById('studentChangePasswordForm').addEventListener('submit', handleStudentPasswordChange);
}

// Handle student password change
async function handleStudentPasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('studentCurrentPassword').value;
    const newPassword = document.getElementById('studentNewPassword').value;

    if (!currentPassword || !newPassword) {
        showAlert('Please fill in both password fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('New password must be at least 6 characters long', 'error');
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
            showAlert('Password changed successfully', 'success');
            document.getElementById('studentChangePasswordForm').reset();
        } else {
            showAlert(data.message || 'Error changing password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Error changing password', 'error');
    }
}

function showSettings() {
    alert('Settings page coming soon! You will be able to:\n\n• Change your password\n• Update profile information\n• Manage notification preferences\n• Set privacy settings');
    profileDropdown.classList.remove('active');
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const response = await fetch('/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            } else {
                showToast('Error logging out', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback - redirect anyway
            window.location.href = '/login';
        }
    }
    profileDropdown.classList.remove('active');
}

// Navigation to Certificate Verification
function goToCertificateVerification() {
    // Open the certificate verification page
    window.open('../certificate_verification/public/index.html', '_blank');
}

// Data Loading Functions
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Animate stat cards with real data
    animateStatCards();
    
    // Load recent activities with real data
    loadRecentActivities();
    
    // Load upcoming deadlines
    loadUpcomingDeadlines();
    
    // Update progress data
    updateProgressData();
}

function loadProgressData() {
    console.log('Loading progress data...');
    
    if (studentData && studentData.performance) {
        updateAcademicProgress();
    }
    
    // Animate progress bars
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 300);
    
    // Animate circular progress
    animateCircularProgress();
}

function updateAcademicProgress() {
    if (!studentData || !studentData.student) return;
    
    const student = studentData.student;
    
    // Update semester progress (assuming 8 semesters total)
    const semesterProgress = ((student.semester || 1) / 8) * 100;
    const semesterProgressBar = document.querySelector('[data-progress="semester"] .progress-fill');
    if (semesterProgressBar) {
        semesterProgressBar.style.width = `${semesterProgress}%`;
    }
    
    // Update credit progress
    const creditProgress = student.completed_credits && student.total_credits ? 
        (student.completed_credits / student.total_credits) * 100 : 0;
    const creditProgressBar = document.querySelector('[data-progress="credits"] .progress-fill');
    if (creditProgressBar) {
        creditProgressBar.style.width = `${creditProgress}%`;
    }
    
    // Update CGPA progress (assuming 10.0 is maximum)
    const cgpaProgress = student.current_cgpa ? (student.current_cgpa / 10.0) * 100 : 0;
    const cgpaProgressBar = document.querySelector('[data-progress="cgpa"] .progress-fill');
    if (cgpaProgressBar) {
        cgpaProgressBar.style.width = `${cgpaProgress}%`;
    }
}

function loadAttendanceData() {
    console.log('Loading attendance data...');
    
    if (studentData && studentData.student && studentData.student.average_attendance) {
        updateAttendanceDisplay();
    }
}

function updateAttendanceDisplay() {
    const attendance = studentData.student.average_attendance;
    
    // Update attendance percentage displays
    const attendanceElements = document.querySelectorAll('.attendance-percentage');
    attendanceElements.forEach(el => {
        el.textContent = `${attendance.toFixed(1)}%`;
        
        // Add color coding
        if (attendance >= 85) {
            el.style.color = '#059669'; // Green
        } else if (attendance >= 75) {
            el.style.color = '#f59e0b'; // Yellow
        } else {
            el.style.color = '#dc2626'; // Red
        }
    });
    
    // Update attendance status
    const statusElements = document.querySelectorAll('.attendance-status');
    statusElements.forEach(el => {
        if (attendance >= 85) {
            el.textContent = 'Excellent';
            el.className = 'attendance-status status-excellent';
        } else if (attendance >= 75) {
            el.textContent = 'Good';
            el.className = 'attendance-status status-good';
        } else {
            el.textContent = 'Needs Improvement';
            el.className = 'attendance-status status-warning';
        }
    });
}

function loadAcademicData() {
    console.log('Loading academic data...');
    
    if (studentData && studentData.performance) {
        updateGradeTable();
        updateSemesterChart();
    }
}

function updateGradeTable() {
    const performance = studentData.performance;
    const gradeTableBody = document.querySelector('#gradesTable tbody');
    
    if (gradeTableBody && performance && performance.length > 0) {
        gradeTableBody.innerHTML = performance.map(subject => `
            <tr>
                <td>${subject.subject_code}</td>
                <td>${subject.subject_name}</td>
                <td>${subject.credits}</td>
                <td>${subject.total_marks || 'N/A'}</td>
                <td>
                    <span class="grade-badge grade-${subject.grade?.toLowerCase() || 'pending'}">
                        ${subject.grade || 'Pending'}
                    </span>
                </td>
                <td>${subject.grade_points || '0.0'}</td>
                <td>
                    <span class="status-badge status-${subject.result_status?.toLowerCase() || 'pending'}">
                        ${subject.result_status || 'Pending'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
}

function loadCertificatesData() {
    console.log('Loading certificates data...');
    
    if (studentData && studentData.certificates) {
        updateCertificatesGrid();
    }
    
    // Add click events to certificate action buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const certId = this.dataset.certId;
            viewCertificateDetails(certId);
        });
    });
    
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', function() {
            const certId = this.dataset.certId;
            downloadCertificate(certId);
        });
    });
}

function updateCertificatesGrid() {
    const certificates = studentData.certificates;
    const certGrid = document.querySelector('.certificates-grid');
    
    if (certGrid && certificates && certificates.length > 0) {
        certGrid.innerHTML = certificates.map(cert => `
            <div class="certificate-card">
                <div class="certificate-header">
                    <div class="certificate-icon">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div class="certificate-status status-${cert.verification_status?.toLowerCase() || 'pending'}">
                        ${cert.verification_status || 'Pending'}
                    </div>
                </div>
                <div class="certificate-body">
                    <h3>${cert.certificate_name}</h3>
                    <p class="certificate-issuer">${cert.issuing_organization}</p>
                    <p class="certificate-date">Issued: ${formatDate(cert.issue_date)}</p>
                    <p class="certificate-type">${cert.certificate_type}</p>
                    ${cert.skill_category ? `<p class="certificate-category">${cert.skill_category}</p>` : ''}
                    ${cert.credit_points ? `<p class="certificate-credits">Credits: ${cert.credit_points}</p>` : ''}
                </div>
                <div class="certificate-actions">
                    <button class="btn btn-view" data-cert-id="${cert.cert_id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${cert.certificate_url ? 
                        `<button class="btn btn-external" onclick="window.open('${cert.certificate_url}', '_blank')">
                            <i class="fas fa-external-link-alt"></i> Original
                        </button>` : ''
                    }
                    <button class="btn btn-download" data-cert-id="${cert.cert_id}">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `).join('');
        
        // Re-attach event listeners
        loadCertificatesData();
    } else if (certGrid) {
        certGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-certificate" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                <h3>No Certificates Yet</h3>
                <p>Upload your first certificate to get started!</p>
                <button class="btn btn-primary" onclick="goToCertificateVerification()">
                    <i class="fas fa-plus"></i> Add Certificate
                </button>
            </div>
        `;
    }
}

function viewCertificateDetails(certId) {
    const certificate = studentData.certificates.find(cert => cert.cert_id == certId);
    if (certificate) {
        const details = `
Certificate Details:

• Name: ${certificate.certificate_name}
• Organization: ${certificate.issuing_organization}
• Issue Date: ${formatDate(certificate.issue_date)}
• Type: ${certificate.certificate_type}
• Status: ${certificate.verification_status}
• Verification Method: ${certificate.verification_method}
${certificate.skill_category ? `• Category: ${certificate.skill_category}` : ''}
${certificate.credit_points ? `• Credit Points: ${certificate.credit_points}` : ''}
${certificate.grade_achieved ? `• Grade: ${certificate.grade_achieved}` : ''}
${certificate.verification_date ? `• Verified On: ${formatDate(certificate.verification_date)}` : ''}
${certificate.verification_notes ? `• Notes: ${certificate.verification_notes}` : ''}
        `;
        alert(details);
    }
}

function downloadCertificate(certId) {
    showToast('Certificate download functionality will be implemented soon', 'info');
}

function loadPortfolioData() {
    console.log('Loading portfolio data...');
    
    // Add click events to portfolio buttons
    document.querySelector('.btn-generate').addEventListener('click', function() {
        generatePortfolio();
    });
    
    document.querySelector('.btn-preview').addEventListener('click', function() {
        previewPortfolio();
    });
}

// Animation Functions
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

function animateCircularProgress() {
    const progressCircle = document.querySelector('.progress-circle');
    if (progressCircle) {
        const percentage = 78; // Get from data
        const degree = (percentage / 100) * 360;
        
        progressCircle.style.background = `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${degree}deg, rgba(255,255,255,0.3) ${degree}deg)`;
    }
}

// Chart Initialization
function initializeCharts() {
    // Note: This is a placeholder for chart initialization
    // In a real application, you would use Chart.js or similar library
    console.log('Charts initialized');
}

// Data Simulation Functions
function loadRecentActivities() {
    const activities = [];
    
    if (studentData && studentData.certificates) {
        // Add certificate-related activities
        studentData.certificates.slice(0, 3).forEach(cert => {
            activities.push({
                icon: 'certificate',
                text: `${cert.certificate_name} certificate ${cert.verification_status.toLowerCase()}`,
                time: formatRelativeTime(cert.created_at),
                status: cert.verification_status.toLowerCase()
            });
        });
    }
    
    // Add some default activities if no certificates
    if (activities.length === 0) {
        activities.push(
            {
                icon: 'book',
                text: 'Welcome to your university portal!',
                time: 'Today',
                status: 'info'
            },
            {
                icon: 'users',
                text: 'Profile setup completed',
                time: formatRelativeTime(currentUser?.lastLogin),
                status: 'verified'
            }
        );
    }
    
    // Update activity list in UI
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item status-${activity.status}">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
    
    console.log('Recent activities loaded:', activities);
}

function loadUpcomingDeadlines() {
    const deadlines = [];
    
    if (studentData && studentData.student) {
        const student = studentData.student;
        
        // Calculate upcoming semester deadlines based on current semester
        const currentSemester = student.semester || 1;
        const nextSemesterStart = new Date();
        nextSemesterStart.setMonth(nextSemesterStart.getMonth() + 2); // Approximate next semester
        
        deadlines.push({
            date: nextSemesterStart.getDate().toString(),
            month: nextSemesterStart.toLocaleDateString('en', { month: 'short' }),
            title: `Semester ${currentSemester + 1} Registration`,
            description: 'Course registration for next semester',
            urgent: false
        });
        
        // Add exam deadlines if in final year
        if (student.current_year >= 4) {
            const examDate = new Date();
            examDate.setMonth(examDate.getMonth() + 1);
            deadlines.push({
                date: examDate.getDate().toString(),
                month: examDate.toLocaleDateString('en', { month: 'short' }),
                title: 'Final Project Submission',
                description: 'Final year project deadline',
                urgent: true
            });
        }
    }
    
    // Add default deadlines if none exist
    if (deadlines.length === 0) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        deadlines.push({
            date: nextMonth.getDate().toString(),
            month: nextMonth.toLocaleDateString('en', { month: 'short' }),
            title: 'Certificate Upload',
            description: 'Upload your certificates for verification',
            urgent: false
        });
    }
    
    // Update deadlines in UI
    const deadlinesList = document.querySelector('.deadlines-list');
    if (deadlinesList) {
        deadlinesList.innerHTML = deadlines.map(deadline => `
            <div class="deadline-item ${deadline.urgent ? 'urgent' : ''}">
                <div class="deadline-date">
                    <span class="date">${deadline.date}</span>
                    <span class="month">${deadline.month}</span>
                </div>
                <div class="deadline-content">
                    <h4 class="deadline-title">${deadline.title}</h4>
                    <p class="deadline-description">${deadline.description}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Check for approaching deadlines and show notifications
    checkDeadlineNotifications(deadlines);
}

function formatRelativeTime(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
}

function checkDeadlineNotifications(deadlines) {
    const urgentDeadlines = deadlines.filter(deadline => deadline.urgent);
    
    if (urgentDeadlines.length > 0) {
        // Add notification for urgent deadlines
        setTimeout(() => {
            showDeadlineNotification(urgentDeadlines[0]);
        }, 2000);
    }
}

function showDeadlineNotification(deadline) {
    // Create and show a notification toast
    const notification = document.createElement('div');
    notification.className = 'deadline-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Deadline Approaching!</strong>
                <p>${deadline.title} - Due ${deadline.date} ${deadline.month}</p>
            </div>
        </div>
    `;
    
    // Add styles for the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        z-index: 1002;
        transform: translateX(400px);
        transition: transform 0.5s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 5000);
}

// Portfolio Functions
function generatePortfolio() {
    // Show loading state
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;
    
    // Simulate portfolio generation
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('Portfolio generated successfully! Check your downloads folder.');
    }, 3000);
}

function previewPortfolio() {
    // Open portfolio preview in new window
    const previewWindow = window.open('', '_blank', 'width=800,height=1000');
    previewWindow.document.write(`
        <html>
            <head>
                <title>Portfolio Preview - John Doe</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2rem; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 2rem; }
                    .section { margin-bottom: 2rem; }
                    .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>John Doe</h1>
                    <p>Computer Science Engineering | CGPA: 8.5 | Batch: 2025</p>
                </div>
                <div class="section">
                    <h2>Academic Performance</h2>
                    <p>Current CGPA: 8.5/10.0</p>
                    <p>Class Rank: Top 10%</p>
                </div>
                <div class="section">
                    <h2>Certifications</h2>
                    <ul>
                        <li>AWS Cloud Practitioner - Amazon Web Services (2024)</li>
                        <li>Azure Fundamentals - Microsoft (2024)</li>
                        <li>Python for Data Science - Coursera (2024)</li>
                    </ul>
                </div>
                <div class="section">
                    <h2>Projects</h2>
                    <ul>
                        <li>E-commerce Web Application using MERN Stack</li>
                        <li>Machine Learning Model for Stock Price Prediction</li>
                        <li>Mobile App for Campus Event Management</li>
                    </ul>
                </div>
                <div class="section">
                    <h2>Extracurricular Activities</h2>
                    <ul>
                        <li>President - Coding Club (2024)</li>
                        <li>Volunteer - Tech Fest Organization (2023-2024)</li>
                        <li>Member - IEEE Student Chapter (2022-2024)</li>
                    </ul>
                </div>
            </body>
        </html>
    `);
}

// Utility Functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function calculateProgress(current, total) {
    return Math.round((current / total) * 100);
}

function showToast(message, type = 'info') {
    // Create and show toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1003;
        transform: translateY(100px);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Search and Filter Functions
function searchCertificates(query) {
    const certificates = document.querySelectorAll('.certificate-card');
    certificates.forEach(cert => {
        const title = cert.querySelector('h3').textContent.toLowerCase();
        const issuer = cert.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(query.toLowerCase()) || issuer.includes(query.toLowerCase())) {
            cert.style.display = 'block';
        } else {
            cert.style.display = 'none';
        }
    });
}

// Real-time Updates
function startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateNotifications();
        updateAttendanceData();
        updateProgressData();
    }, 30000);
}

function updateNotifications() {
    // Simulate new notifications
    const notifications = [
        'New assignment posted in Machine Learning',
        'Grade updated for Database Management',
        'Reminder: Tech Fest registration closes tomorrow'
    ];
    
    // Randomly add a new notification
    if (Math.random() > 0.7) {
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        addNewNotification(randomNotification);
    }
}

function addNewNotification(message) {
    const notificationList = document.querySelector('.notification-list');
    const newNotification = document.createElement('div');
    newNotification.className = 'notification-item unread';
    newNotification.innerHTML = `
        <i class="fas fa-bell"></i>
        <div class="notification-content">
            <p>${message}</p>
            <span class="notification-time">Just now</span>
        </div>
    `;
    
    notificationList.insertBefore(newNotification, notificationList.firstChild);
    updateNotificationBadge();
    
    // Add click event to new notification
    newNotification.addEventListener('click', function() {
        this.classList.remove('unread');
        updateNotificationBadge();
    });
}

// Initialize real-time updates when the page loads
document.addEventListener('DOMContentLoaded', function() {
    startRealTimeUpdates();
});