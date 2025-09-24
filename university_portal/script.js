// University Portal JavaScript
let currentUser = null;
let departments = [];
let courses = [];
let academicYears = [];
let facultyList = [];
let classList = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize application
async function initializeApp() {
    try {
        // Check authentication
        const response = await fetch('/api/user-profile');
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            updateWelcomeMessage();
            loadInitialData();
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        window.location.href = '/login';
    }
}

// Update welcome message
function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (currentUser) {
        const name = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        welcomeMessage.textContent = `Welcome, ${name || currentUser.username}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Forms
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);
    document.getElementById('facultyForm').addEventListener('submit', handleFacultySubmit);
    document.getElementById('mentorAssignForm').addEventListener('submit', handleMentorAssign);
}

// Navigation function
function showSection(sectionId) {
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const parent = link.closest('.nav-item');
        parent.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            parent.classList.add('active');
        }
    });

    // Update content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Dashboard',
        'create-student': 'Create Student',
        'create-faculty': 'Create Faculty',
        'departments': 'Departments',
        'faculty-list': 'Faculty Management',
        'assign-mentor': 'Assign Mentors'
    };
    pageTitle.textContent = titles[sectionId] || 'Dashboard';

    // Load section-specific data
    loadSectionData(sectionId);
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'create-student':
            loadStudentFormData();
            break;
        case 'create-faculty':
            loadFacultyFormData();
            break;
        case 'departments':
            loadDepartments(); // Updated to use our new function
            break;
        case 'faculty-list':
            loadFacultyList();
            break;
        case 'assign-mentor':
            loadMentorAssignData();
            break;
    }
}

// Load initial data
async function loadInitialData() {
    showLoading(true);
    try {
        await Promise.all([
            loadDashboardStats(),
            loadDepartments(),
            loadAcademicYears(),
            loadFacultyData()
        ]);
        loadDashboardData();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data', 'error');
    } finally {
        showLoading(false);
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/university/dashboard-stats');
        if (response.ok) {
            const stats = await response.json();
            updateDashboardStats(stats);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('totalFaculty').textContent = stats.totalFaculty || 0;
    document.getElementById('totalDepartments').textContent = stats.totalDepartments || 0;
    document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
}

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch('/api/university/analytics');
        if (response.ok) {
            const data = await response.json();
            if (data.departmentStats) {
                displayDepartmentTree(data.departmentStats);
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Load academic years
async function loadAcademicYears() {
    try {
        const response = await fetch('/api/academic-years');
        if (response.ok) {
            academicYears = await response.json();
        }
    } catch (error) {
        console.error('Error loading academic years:', error);
    }
}

// Load faculty data
async function loadFacultyData() {
    try {
        const response = await fetch('/api/faculty-list');
        if (response.ok) {
            facultyList = await response.json();
        }
    } catch (error) {
        console.error('Error loading faculty data:', error);
    }
}

// Load dashboard data
function loadDashboardData() {
    loadDashboardChart();
}

// Load dashboard chart
function loadDashboardChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;

    const chartData = {
        labels: departments.map(d => d.dept_name),
        datasets: [{
            label: 'Students',
            data: departments.map(d => d.student_count),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ]
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load student form data
function loadStudentFormData() {
    loadDepartmentOptions('department');
    populateAcademicYearSelect('academicYear');
}

// Load faculty form data
function loadFacultyFormData() {
    loadDepartmentOptions('facultyDepartment');
}

// Load department structure
function loadDepartmentStructure() {
    const container = document.getElementById('departmentTree');
    if (!container) return;

    let html = '';
    departments.forEach(dept => {
        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-building text-primary"></i>
                        ${dept.dept_name} (${dept.dept_code})
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-item">
                                <strong>${dept.course_count}</strong>
                                <small class="text-muted d-block">Courses</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-item">
                                <strong>${dept.faculty_count}</strong>
                                <small class="text-muted d-block">Faculty</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-item">
                                <strong>${dept.student_count}</strong>
                                <small class="text-muted d-block">Students</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewDepartmentDetails(${dept.dept_id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Load faculty list
function loadFacultyList() {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;

    let html = '';
    facultyList.forEach(faculty => {
        html += `
            <tr>
                <td><strong>${faculty.faculty_code}</strong></td>
                <td>${faculty.first_name} ${faculty.last_name}</td>
                <td>${faculty.dept_name}</td>
                <td>${faculty.designation}</td>
                <td>${faculty.email}</td>
                <td>${faculty.mentor_class || 'Not Assigned'}</td>
                <td>
                    <span class="badge bg-${faculty.status === 'active' ? 'success' : 'secondary'}">
                        ${faculty.status}
                    </span>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Load mentor assignment data
function loadMentorAssignData() {
    populateFacultySelect('selectFaculty');
    populateClassSelect('selectClass');
    loadMentorAssignments();
}

// Load department options from API
async function loadDepartmentOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const response = await fetch('/api/departments-list');
        if (response.ok) {
            const departments = await response.json();
            select.innerHTML = '<option value="">Select Department</option>';
            
            if (departments.length === 0) {
                select.innerHTML += '<option value="" disabled>No departments available - Create departments first</option>';
            } else {
                departments.forEach(dept => {
                    select.innerHTML += `<option value="${dept.dept_id}">${dept.dept_name} (${dept.dept_code})</option>`;
                });
            }
        } else {
            select.innerHTML = '<option value="" disabled>Error loading departments</option>';
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        select.innerHTML = '<option value="" disabled>Error loading departments</option>';
    }
}

// Populate department select (legacy function - keeping for compatibility)
function populateDepartmentSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(dept => {
        select.innerHTML += `<option value="${dept.dept_id}">${dept.dept_name}</option>`;
    });
}

// Populate academic year select
function populateAcademicYearSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Academic Year</option>';
    academicYears.forEach(year => {
        select.innerHTML += `<option value="${year.year_id}">${year.year_name}</option>`;
    });
}

// Populate faculty select
function populateFacultySelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Choose Faculty Member</option>';
    facultyList.forEach(faculty => {
        select.innerHTML += `<option value="${faculty.faculty_id}">${faculty.first_name} ${faculty.last_name} (${faculty.faculty_code})</option>`;
    });
}

// Populate class select
function populateClassSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Choose Class</option>';
    classList.forEach(cls => {
        select.innerHTML += `<option value="${cls.class_id}">${cls.class_name}</option>`;
    });
}

// Load courses by department
async function loadCourses() {
    const deptId = document.getElementById('department').value;
    const courseSelect = document.getElementById('course');
    
    if (!deptId) {
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        return;
    }

    try {
        const response = await fetch(`/api/department/${deptId}/courses`);
        if (response.ok) {
            courses = await response.json();
            courseSelect.innerHTML = '<option value="">Select Course</option>';
            courses.forEach(course => {
                courseSelect.innerHTML += `<option value="${course.course_id}">${course.course_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Load classes by year and course
async function loadClasses() {
    const yearId = document.getElementById('academicYear').value;
    const courseId = document.getElementById('course').value;
    const classSelect = document.getElementById('classSection');
    
    if (!yearId || !courseId) {
        classSelect.innerHTML = '<option value="">Select Class & Section</option>';
        return;
    }

    try {
        const response = await fetch(`/api/classes/${yearId}/${courseId}`);
        if (response.ok) {
            const classes = await response.json();
            classSelect.innerHTML = '<option value="">Select Class & Section</option>';
            classes.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls.class_id}">${cls.class_name} (${cls.section})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// Load all classes for mentor assignment
async function loadAllClasses() {
    try {
        const response = await fetch('/api/academic-years');
        if (response.ok) {
            const years = await response.json();
            classList = [];
            
            for (const year of years) {
                for (const course of courses) {
                    const classResponse = await fetch(`/api/classes/${year.year_id}/${course.course_id}`);
                    if (classResponse.ok) {
                        const classes = await classResponse.json();
                        classList.push(...classes);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading all classes:', error);
    }
}

// Handle student form submission
async function handleStudentSubmit(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const formData = {
            register_number: document.getElementById('registerNumber').value,
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date_of_birth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            dept_id: document.getElementById('department').value,
            current_semester: parseInt(document.getElementById('currentSemester').value) || 1,
            current_year: parseInt(document.getElementById('currentYear').value) || 1,
            parent_name: document.getElementById('parentName').value,
            parent_phone: document.getElementById('parentPhone').value,
            parent_email: document.getElementById('parentEmail').value,
            address: document.getElementById('address').value,
            password: document.getElementById('password').value
        };

        const response = await fetch('/api/create-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Student account created successfully!', 'success');
            resetStudentForm();
            loadDashboardStats(); // Refresh stats
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

// Handle faculty form submission
async function handleFacultySubmit(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const formData = {
            faculty_code: document.getElementById('facultyCode').value,
            first_name: document.getElementById('facultyFirstName').value,
            last_name: document.getElementById('facultyLastName').value,
            email: document.getElementById('facultyEmail').value,
            phone: document.getElementById('facultyPhone').value,
            date_of_birth: document.getElementById('facultyDOB').value,
            gender: document.getElementById('facultyGender').value,
            dept_id: document.getElementById('facultyDepartment').value,
            designation: document.getElementById('designation').value,
            qualification: document.getElementById('qualification').value,
            experience_years: parseInt(document.getElementById('experience').value) || 0,
            date_of_joining: document.getElementById('joiningDate').value,
            password: document.getElementById('facultyPassword').value
        };

        const response = await fetch('/api/create-faculty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Faculty account created successfully!', 'success');
            resetFacultyForm();
            loadDashboardStats(); // Refresh stats
            loadFacultyData(); // Refresh faculty list
        } else {
            showNotification(result.message || 'Error creating faculty account', 'error');
        }
    } catch (error) {
        console.error('Error creating faculty:', error);
        showNotification('Error creating faculty account', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle mentor assignment
async function handleMentorAssign(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const formData = {
            faculty_id: document.getElementById('selectFaculty').value,
            class_id: document.getElementById('selectClass').value
        };

        const response = await fetch('/api/assign-faculty-mentor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Faculty assigned as mentor successfully!', 'success');
            document.getElementById('mentorAssignForm').reset();
            loadMentorAssignments(); // Refresh assignments
            loadFacultyData(); // Refresh faculty list
        } else {
            showNotification(result.message || 'Error assigning mentor', 'error');
        }
    } catch (error) {
        console.error('Error assigning mentor:', error);
        showNotification('Error assigning mentor', 'error');
    } finally {
        showLoading(false);
    }
}

// Load mentor assignments
function loadMentorAssignments() {
    const tbody = document.getElementById('mentorAssignmentsTable');
    if (!tbody) return;

    let html = '';
    facultyList.filter(f => f.mentor_class).forEach(faculty => {
        html += `
            <tr>
                <td>${faculty.mentor_class}</td>
                <td>${faculty.course_name || 'N/A'}</td>
                <td>${faculty.first_name} ${faculty.last_name}</td>
                <td>${faculty.dept_name}</td>
                <td>${faculty.student_count || 0}</td>
            </tr>
        `;
    });
    
    if (html === '') {
        html = '<tr><td colspan="5" class="text-center text-muted">No mentor assignments found</td></tr>';
    }
    
    tbody.innerHTML = html;
}

// Reset forms
function resetStudentForm() {
    document.getElementById('studentForm').reset();
    // Reload department options after reset
    loadDepartmentOptions('department');
}

function resetFacultyForm() {
    document.getElementById('facultyForm').reset();
}

// Utility functions
function refreshData() {
    loadInitialData();
    showNotification('Data refreshed successfully!', 'success');
}

function viewDepartmentDetails(deptId) {
    // Future implementation
    showNotification('Department details view coming soon!', 'info');
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with toast notifications
    const alertClass = type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info';
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/logout', { method: 'POST' })
            .then(() => {
                window.location.href = '/login';
            })
            .catch(() => {
                window.location.href = '/login';
            });
    }
}

// Department Management Functions
function resetDepartmentForm() {
    document.getElementById('departmentForm').reset();
}

async function createDepartment(event) {
    event.preventDefault();
    
    const formData = {
        dept_code: document.getElementById('deptCode').value.trim().toUpperCase(),
        dept_name: document.getElementById('deptName').value.trim(),
        established_year: document.getElementById('establishedYear').value
    };

    try {
        showLoading(true);
        const response = await fetch('/university/api/create-department', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('Department created successfully!', 'success');
            resetDepartmentForm();
            loadDepartments(); // Refresh department list
        } else {
            showNotification(result.message || 'Error creating department', 'error');
        }
    } catch (error) {
        console.error('Error creating department:', error);
        showNotification('Error creating department', 'error');
    } finally {
        showLoading(false);
    }
}

function displayDepartmentTree(departments) {
    const container = document.getElementById('departmentTree');
    
    if (!departments || departments.length === 0) {
        container.innerHTML = '<p class="text-muted">No departments found.</p>';
        return;
    }

    let html = '<div class="list-group">';
    
    departments.forEach(dept => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${dept.dept_name} (${dept.dept_code})</h6>
                        <p class="mb-1 text-muted">Head: ${dept.dept_head || 'Not assigned'}</p>
                        <small>Students: ${dept.student_count || 0} | Faculty: ${dept.faculty_count || 0}</small>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="viewDepartmentDetails(${dept.dept_id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function viewDepartmentDetails(deptId) {
    try {
        showLoading(true);
        const response = await fetch(`/university/api/department/${deptId}/details`);
        const data = await response.json();
        
        if (data.department) {
            displayDepartmentDetailsModal(data.department, data.academicYears);
        } else {
            showNotification('Error loading department details', 'error');
        }
    } catch (error) {
        console.error('Error loading department details:', error);
        showNotification('Error loading department details', 'error');
    } finally {
        showLoading(false);
    }
}

function displayDepartmentDetailsModal(department, academicYears) {
    const modalTitle = document.getElementById('departmentDetailsModalLabel');
    const modalContent = document.getElementById('departmentDetailsContent');
    
    modalTitle.textContent = `${department.dept_name} (${department.dept_code})`;
    
    let html = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>Department Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Code:</strong></td><td>${department.dept_code}</td></tr>
                    <tr><td><strong>Name:</strong></td><td>${department.dept_name}</td></tr>
                    <tr><td><strong>Head:</strong></td><td>${department.dept_head || 'Not assigned'}</td></tr>
                    <tr><td><strong>Established:</strong></td><td>${department.established_year}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Statistics</h6>
                <table class="table table-sm">
                    <tr><td><strong>Total Students:</strong></td><td>${department.student_count}</td></tr>
                    <tr><td><strong>Total Faculty:</strong></td><td>${department.faculty_count}</td></tr>
                    <tr><td><strong>Total Courses:</strong></td><td>${department.course_count}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge bg-success">${department.status}</span></td></tr>
                </table>
            </div>
        </div>
        
        <h6>Academic Years</h6>
    `;
    
    if (academicYears && academicYears.length > 0) {
        html += '<div class="list-group">';
        academicYears.forEach(year => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${year.year_name}</h6>
                        <small class="text-muted">Students: ${year.student_count} | Classes: ${year.class_count}</small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="viewAcademicYearClasses(${department.dept_id}, ${year.year_id}, '${year.year_name}')">
                        <i class="fas fa-list"></i> View Classes
                    </button>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p class="text-muted">No academic years found.</p>';
    }
    
    modalContent.innerHTML = html;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('departmentDetailsModal'));
    modal.show();
}

async function viewAcademicYearClasses(deptId, yearId, yearName) {
    try {
        showLoading(true);
        const response = await fetch(`/university/api/department/${deptId}/year/${yearId}/classes`);
        const classes = await response.json();
        
        displayAcademicYearModal(classes, yearName, deptId, yearId);
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes', 'error');
    } finally {
        showLoading(false);
    }
}

function displayAcademicYearModal(classes, yearName, deptId, yearId) {
    const modalTitle = document.getElementById('academicYearModalLabel');
    const modalContent = document.getElementById('academicYearContent');
    
    modalTitle.textContent = `Classes in ${yearName}`;
    
    let html = '';
    
    if (classes && classes.length > 0) {
        html += '<div class="list-group">';
        classes.forEach(cls => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${cls.class_name}</h6>
                        <p class="mb-1">${cls.course_name}</p>
                        <small class="text-muted">Mentor: ${cls.mentor_name || 'Not assigned'} | Students: ${cls.student_count}</small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="viewClassStudents(${cls.class_id}, '${cls.class_name}')">
                        <i class="fas fa-users"></i> View Students
                    </button>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p class="text-muted">No classes found for this academic year.</p>';
    }
    
    modalContent.innerHTML = html;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('academicYearModal'));
    modal.show();
}

async function viewClassStudents(classId, className) {
    try {
        showLoading(true);
        const response = await fetch(`/university/api/class/${classId}/students`);
        const students = await response.json();
        
        displayClassStudentsModal(students, className);
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Error loading students', 'error');
    } finally {
        showLoading(false);
    }
}

function displayClassStudentsModal(students, className) {
    const modalTitle = document.getElementById('classStudentsModalLabel');
    const modalContent = document.getElementById('classStudentsContent');
    
    modalTitle.textContent = `Students in ${className}`;
    
    let html = '';
    
    if (students && students.length > 0) {
        html += `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Register No.</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Course</th>
                            <th>Mentor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.forEach(student => {
            html += `
                <tr>
                    <td>${student.register_number}</td>
                    <td>${student.first_name} ${student.last_name}</td>
                    <td>${student.email}</td>
                    <td>${student.course_name}</td>
                    <td>${student.mentor_name || 'Not assigned'}</td>
                    <td><span class="badge bg-success">${student.enrollment_status}</span></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += '<p class="text-muted">No students found in this class.</p>';
    }
    
    modalContent.innerHTML = html;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('classStudentsModal'));
    modal.show();
}

// Clear all departments function
async function clearAllDepartments() {
    if (confirm('Are you sure you want to clear all departments? This action cannot be undone.')) {
        try {
            showLoading(true);
            const response = await fetch('/university/api/clear-departments', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('All departments cleared successfully!', 'success');
                loadDepartments(); // Refresh department list
                loadDashboardStats(); // Refresh dashboard stats
            } else {
                showNotification(result.message || 'Error clearing departments', 'error');
            }
        } catch (error) {
            console.error('Error clearing departments:', error);
            showNotification('Error clearing departments', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Add department form event listener
document.addEventListener('DOMContentLoaded', function() {
    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
        departmentForm.addEventListener('submit', createDepartment);
    }
});