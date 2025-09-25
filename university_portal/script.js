// University Portal JavaScript
let currentUser = null;
let departments = [];
let courses = [];
let academicYears = [];
let facultyList = [];
let classList = [];
let dashboardCache = null;
let cacheTime = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing app...');
    startApp();
});

function startApp() {
    console.log('🎯 Starting application initialization...');
    setupEventListeners();
    initializeApp();
}

// Initialize application - optimized for speed
async function initializeApp() {
    try {
        console.log('🚀 Initializing application...');
        showLoading(true);
        
        // Check authentication and load dashboard stats in parallel
        const [authResponse] = await Promise.all([
            fetch('/api/user-profile'),
            loadDashboardStats() // Load stats immediately, don't wait
        ]);
        
        const data = await authResponse.json();
        
        if (data.success) {
            currentUser = data.user;
            updateWelcomeMessage();
            
            // Start auto-refresh cycle
            startAutoRefresh();
        } else {
            console.error('❌ Authentication failed, redirecting to login');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        window.location.href = '/login';
    } finally {
        showLoading(false);
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
        'assign-mentor': 'Assign Mentors',
        'subjects': 'Subject Management'
    };
    pageTitle.textContent = titles[sectionId] || 'Dashboard';

    // Load section-specific data
    loadSectionData(sectionId);
}

// Load section-specific data only when needed
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            // Dashboard stats already loaded and auto-refreshing
            loadDashboardChart();
            break;
        case 'create-student':
            loadStudentFormData();
            break;
        case 'create-faculty':
            loadFacultyFormData();
            break;
        case 'departments':
            loadDepartments();
            break;
        case 'faculty-list':
            loadFacultyList();
            break;
        case 'assign-mentor':
            loadMentorAssignData();
            break;
        case 'subjects':
            initializeSubjectsSection();
            break;
    }
}

// Start auto-refresh cycle
function startAutoRefresh() {
    // Refresh dashboard stats every 5 minutes instead of 30 seconds
    setInterval(() => {
        loadDashboardStats();
    }, 300000); // 5 minutes = 300,000 ms
}

// Load initial data only when needed
async function loadInitialData() {
    try {
        // Only load departments initially - other data loaded on demand
        await loadDepartments();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Load dashboard statistics with caching
async function loadDashboardStats() {
    try {
        // Check cache first (cache for 2 minutes)
        const now = Date.now();
        if (dashboardCache && (now - cacheTime) < 120000) {
            updateDashboardStats(dashboardCache);
            return;
        }

        // Load counts from each table in parallel - much faster
        const [studentsResponse, facultyResponse, departmentsResponse] = await Promise.all([
            fetch('/api/students'),
            fetch('/api/faculty-list'),
            fetch('/api/departments')
        ]);

        let totalStudents = 0, totalFaculty = 0, totalDepartments = 0;

        // Process responses quickly
        const [studentsData, facultyData, departmentsData] = await Promise.all([
            studentsResponse.ok ? studentsResponse.json() : null,
            facultyResponse.ok ? facultyResponse.json() : null,
            departmentsResponse.ok ? departmentsResponse.json() : null
        ]);

        if (studentsData?.success && studentsData.students) {
            totalStudents = studentsData.students.length;
        }

        if (facultyData?.success && facultyData.faculty) {
            totalFaculty = facultyData.faculty.length;
        }

        if (departmentsData?.success && departmentsData.departments) {
            totalDepartments = departmentsData.departments.length;
        }

        const stats = {
            totalStudents,
            totalFaculty,
            totalDepartments
        };

        // Cache the results
        dashboardCache = stats;
        cacheTime = now;

        updateDashboardStats(stats);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Show cached data if available
        if (dashboardCache) {
            updateDashboardStats(dashboardCache);
        }
    }
}

// Update dashboard statistics - optimized for speed
function updateDashboardStats(stats) {
    // Direct immediate update - no delays needed
    const studentsElement = document.getElementById('totalStudents');
    const facultyElement = document.getElementById('totalFaculty');
    const departmentsElement = document.getElementById('totalDepartments');
    
    if (studentsElement) {
        studentsElement.textContent = stats.totalStudents || 0;
    }
    
    if (facultyElement) {
        facultyElement.textContent = stats.totalFaculty || 0;
    }
    
    if (departmentsElement) {
        departmentsElement.textContent = stats.totalDepartments || 0;
    }
}

// Load departments with caching
let departmentsCache = null;
let departmentsCacheTime = 0;

async function loadDepartments() {
    try {
        // Check cache first (cache for 30 seconds)
        const now = Date.now();
        if (departmentsCache && (now - departmentsCacheTime) < 30000) {
            displayDepartmentTree(departmentsCache);
            return;
        }

        const response = await fetch('/api/departments');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.departments) {
                departments = data.departments;
                departmentsCache = data.departments;
                departmentsCacheTime = now;
                displayDepartmentTree(data.departments);
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        // Show cached data if available
        if (departmentsCache) {
            displayDepartmentTree(departmentsCache);
        } else {
            showNotification('Error loading departments', 'error');
        }
    }
}

// Load academic years for dashboard (legacy function)
async function loadAcademicYearsForDashboard() {
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
            const data = await response.json();
            if (data.success) {
                facultyList = data.faculty;
            }
        }
    } catch (error) {
        console.error('Error loading faculty data:', error);
    }
}

// Load dashboard chart
function loadDashboardChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx || departments.length === 0) return;

    const chartData = {
        labels: departments.map(d => d.dept_name || d.name),
        datasets: [{
            label: 'Students',
            data: departments.map(d => d.student_count || 0),
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
async function loadStudentFormData() {
    console.log('DEBUG: Loading student form data');
    await loadDepartmentOptions('department');
    // Reset dependent dropdowns
    document.getElementById('academicYear').innerHTML = '<option value="">Select Academic Year</option>';
    document.getElementById('studentClass').innerHTML = '<option value="">Select Class & Section</option>';
}

// Load academic years for selected department
async function loadAcademicYears() {
    const departmentId = document.getElementById('department').value;
    const academicYearSelect = document.getElementById('academicYear');
    const classSelect = document.getElementById('studentClass');
    
    console.log('DEBUG: loadAcademicYears called with departmentId:', departmentId);
    
    // Reset dependent dropdowns
    academicYearSelect.innerHTML = '<option value="">Select Academic Year</option>';
    classSelect.innerHTML = '<option value="">Select Class & Section</option>';
    
    if (!departmentId) {
        console.log('DEBUG: No department selected, returning');
        return;
    }
    
    try {
        console.log('DEBUG: Fetching academic years for department:', departmentId);
        const response = await fetch(`/api/departments/${departmentId}/details`);
        console.log('DEBUG: Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: Academic years data:', data);
            
            if (data.success && data.academicYears) {
                if (data.academicYears.length > 0) {
                    console.log('DEBUG: Found', data.academicYears.length, 'academic years');
                    data.academicYears.forEach(year => {
                        const optionElement = document.createElement('option');
                        optionElement.value = year.id;
                        optionElement.textContent = year.year_range;
                        academicYearSelect.appendChild(optionElement);
                    });
                } else {
                    console.log('DEBUG: No academic years found for department');
                    const optionElement = document.createElement('option');
                    optionElement.value = '';
                    optionElement.disabled = true;
                    optionElement.textContent = 'No academic years available for this department';
                    academicYearSelect.appendChild(optionElement);
                }
            } else {
                console.log('DEBUG: API returned error or no data:', data);
            }
        } else {
            console.log('DEBUG: Response not ok:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading academic years:', error);
        showNotification('Error loading academic years', 'error');
    }
}

// Load classes for selected academic year
async function loadClasses() {
    const academicYearId = document.getElementById('academicYear').value;
    const classSelect = document.getElementById('studentClass');
    
    console.log('DEBUG: loadClasses called with academicYearId:', academicYearId);
    
    // Reset class dropdown
    classSelect.innerHTML = '<option value="">Select Class & Section</option>';
    
    if (!academicYearId) {
        console.log('DEBUG: No academic year selected, returning');
        return;
    }
    
    try {
        console.log('DEBUG: Fetching classes for academic year:', academicYearId);
        const response = await fetch(`/api/academic-years/${academicYearId}/classes`);
        console.log('DEBUG: Classes response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: Classes data:', data);
            
            if (data.success && data.classes) {
                if (data.classes.length > 0) {
                    console.log('DEBUG: Found', data.classes.length, 'classes');
                    data.classes.forEach(cls => {
                        const capacity = cls.capacity || 60;
                        const currentStrength = cls.current_strength || 0;
                        const availableSlots = capacity - currentStrength;
                        const statusText = availableSlots > 0 ? `(${availableSlots} slots available)` : '(Full)';
                        const disabled = availableSlots <= 0 ? 'disabled' : '';
                        
                        const optionElement = document.createElement('option');
                        optionElement.value = cls.id;
                        optionElement.textContent = `${cls.class_name} - Section ${cls.section} ${statusText}`;
                        if (disabled) optionElement.disabled = true;
                        
                        classSelect.appendChild(optionElement);
                        
                        console.log('DEBUG: Added class option:', cls.class_name, cls.section, statusText);
                    });
                } else {
                    console.log('DEBUG: No classes found for academic year');
                    const optionElement = document.createElement('option');
                    optionElement.value = '';
                    optionElement.disabled = true;
                    optionElement.textContent = 'No classes available for this academic year';
                    classSelect.appendChild(optionElement);
                }
            } else {
                console.log('DEBUG: API returned error for classes:', data);
                showNotification('Invalid response from server', 'error');
            }
        } else {
            console.log('DEBUG: Classes response not ok:', response.status, response.statusText);
            showNotification('Failed to load classes', 'error');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes', 'error');
    }
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
async function loadFacultyList() {
    try {
        const response = await fetch('/api/faculty-list');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayFacultyList(data.faculty);
            }
        }
    } catch (error) {
        console.error('Error loading faculty list:', error);
        showNotification('Error loading faculty list', 'error');
    }
}

// Display faculty list in table
function displayFacultyList(faculty) {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;

    if (!faculty || faculty.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No faculty members found</td></tr>';
        return;
    }

    let html = '';
    faculty.forEach(fac => {
        const joiningDate = fac.date_of_joining ? new Date(fac.date_of_joining).toLocaleDateString() : 'N/A';
        const dateOfBirth = fac.date_of_birth ? new Date(fac.date_of_birth).toLocaleDateString() : 'N/A';
        
        html += `
            <tr>
                <td><strong>${fac.faculty_code}</strong></td>
                <td>
                    <div class="fw-bold">${fac.first_name} ${fac.last_name}</div>
                    <small class="text-muted">${fac.email}</small>
                </td>
                <td>${fac.department}</td>
                <td>
                    <span class="badge bg-primary">${fac.designation}</span>
                </td>
                <td>
                    <div><i class="fas fa-envelope me-1"></i>${fac.email}</div>
                    ${fac.phone ? `<div><i class="fas fa-phone me-1"></i>${fac.phone}</div>` : ''}
                </td>
                <td>
                    <div><strong>Qualification:</strong> ${fac.qualification || 'N/A'}</div>
                    <div><strong>Experience:</strong> ${fac.experience_years || 0} years</div>
                    <div><strong>DOB:</strong> ${dateOfBirth}</div>
                    <div><strong>Joined:</strong> ${joiningDate}</div>
                </td>
                <td>
                    <span class="badge bg-${fac.status === 'active' ? 'success' : 'secondary'}">
                        ${fac.status}
                    </span>
                    <div class="mt-1">
                        <button class="btn btn-sm btn-outline-info" onclick="viewFacultyDetails(${fac.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Load mentor assignment data
async function loadMentorAssignData() {
    console.log('Loading mentor assignment data...');
    
    // Initialize mentor table first
    try {
        await fetch('/api/init-mentor-table');
        console.log('Mentor table initialized');
    } catch (error) {
        console.error('Error initializing mentor table:', error);
    }
    
    // Load department options
    await loadDepartmentOptions('mentorDepartment');
    
    // Load existing mentor assignments
    loadMentorAssignments();
}

// Load department options from API
async function loadDepartmentOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.log('DEBUG: Department select element not found:', selectId);
        return;
    }

    console.log('DEBUG: Loading department options for:', selectId);

    try {
        const response = await fetch('/api/departments');
        console.log('DEBUG: Departments API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: Departments data:', data);
            
            if (data.success && data.departments) {
                select.innerHTML = '<option value="">Select Department</option>';
                
                if (data.departments.length === 0) {
                    select.innerHTML += '<option value="" disabled>No departments available - Create departments first</option>';
                } else {
                    data.departments.forEach(dept => {
                        const option = `<option value="${dept.id}">${dept.name} (${dept.code})</option>`;
                        select.innerHTML += option;
                        console.log('DEBUG: Added department option:', dept.name);
                    });
                }
            } else {
                console.log('DEBUG: Departments API returned error or no data');
                select.innerHTML = '<option value="" disabled>No departments found</option>';
            }
        } else {
            console.log('DEBUG: Departments API response not ok:', response.status);
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

// Load classes by year and course (legacy function)
async function loadClassesByYearAndCourse() {
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
            department: document.getElementById('department').value,
            academic_year: document.getElementById('academicYear').value,
            class_id: document.getElementById('studentClass').value,
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
            department: document.getElementById('facultyDepartment').value, // Changed from dept_id to department
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

// Load academic years for mentor assignment based on selected department
async function loadMentorAcademicYears() {
    const deptSelect = document.getElementById('mentorDepartment');
    const yearSelect = document.getElementById('mentorAcademicYear');
    const classSelect = document.getElementById('mentorClass');
    const facultySelect = document.getElementById('mentorFaculty');
    
    // Reset dependent dropdowns
    yearSelect.innerHTML = '<option value="">Select Academic Year</option>';
    classSelect.innerHTML = '<option value="">Select Class</option>';
    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    
    yearSelect.disabled = true;
    classSelect.disabled = true;
    facultySelect.disabled = true;
    document.getElementById('assignMentorBtn').disabled = true;
    document.getElementById('selectionSummary').style.display = 'none';
    
    if (!deptSelect.value) return;

    try {
        const response = await fetch(`/api/departments/${deptSelect.value}/details`);
        const data = await response.json();
        
        if (data.success && data.academicYears && data.academicYears.length > 0) {
            data.academicYears.forEach(year => {
                yearSelect.innerHTML += `<option value="${year.id}">${year.year_range}</option>`;
            });
            yearSelect.disabled = false;
        } else {
            yearSelect.innerHTML += '<option value="" disabled>No academic years found</option>';
        }
    } catch (error) {
        console.error('Error loading academic years:', error);
        yearSelect.innerHTML += '<option value="" disabled>Error loading academic years</option>';
    }
}

// Load classes for mentor assignment based on selected academic year
async function loadMentorClasses() {
    const yearSelect = document.getElementById('mentorAcademicYear');
    const classSelect = document.getElementById('mentorClass');
    const facultySelect = document.getElementById('mentorFaculty');
    
    // Reset dependent dropdowns
    classSelect.innerHTML = '<option value="">Select Class</option>';
    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    classSelect.disabled = true;
    facultySelect.disabled = true;
    document.getElementById('assignMentorBtn').disabled = true;
    document.getElementById('selectionSummary').style.display = 'none';
    
    if (!yearSelect.value) return;

    try {
        const response = await fetch(`/api/academic-years/${yearSelect.value}/classes`);
        const data = await response.json();
        
        if (data.success && data.classes && data.classes.length > 0) {
            data.classes.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls.id}">${cls.class_name} - Section ${cls.section} (${cls.current_strength || 0}/${cls.capacity || 60} students)</option>`;
            });
            classSelect.disabled = false;
        } else {
            classSelect.innerHTML += '<option value="" disabled>No classes found</option>';
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        classSelect.innerHTML += '<option value="" disabled>Error loading classes</option>';
    }
}

// Load faculty for mentor assignment based on selected department
async function loadMentorFaculty() {
    const deptSelect = document.getElementById('mentorDepartment');
    const classSelect = document.getElementById('mentorClass');
    const facultySelect = document.getElementById('mentorFaculty');
    
    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    facultySelect.disabled = true;
    document.getElementById('assignMentorBtn').disabled = true;
    
    if (!deptSelect.value || !classSelect.value) return;

    try {
        const response = await fetch(`/api/faculty-by-department/${deptSelect.value}`);
        const data = await response.json();
        
        if (data.success && data.faculty && data.faculty.length > 0) {
            data.faculty.forEach(faculty => {
                facultySelect.innerHTML += `<option value="${faculty.id}">${faculty.first_name} ${faculty.last_name} (${faculty.faculty_code}) - ${faculty.designation}</option>`;
            });
            facultySelect.disabled = false;
            updateMentorSelectionSummary();
        } else {
            facultySelect.innerHTML += '<option value="" disabled>No faculty found in this department</option>';
        }
    } catch (error) {
        console.error('Error loading faculty:', error);
        facultySelect.innerHTML += '<option value="" disabled>Error loading faculty</option>';
    }
}

// Update selection summary and enable/disable assign button
function updateMentorSelectionSummary() {
    const deptSelect = document.getElementById('mentorDepartment');
    const yearSelect = document.getElementById('mentorAcademicYear');
    const classSelect = document.getElementById('mentorClass');
    const facultySelect = document.getElementById('mentorFaculty');
    const summaryDiv = document.getElementById('selectionSummary');
    const summaryText = document.getElementById('summaryText');
    const assignBtn = document.getElementById('assignMentorBtn');
    
    if (deptSelect.value && yearSelect.value && classSelect.value && facultySelect.value) {
        const deptText = deptSelect.options[deptSelect.selectedIndex].text;
        const yearText = yearSelect.options[yearSelect.selectedIndex].text;
        const classText = classSelect.options[classSelect.selectedIndex].text;
        const facultyText = facultySelect.options[facultySelect.selectedIndex].text;
        
        summaryText.innerHTML = `
            <strong>Department:</strong> ${deptText}<br>
            <strong>Academic Year:</strong> ${yearText}<br>
            <strong>Class:</strong> ${classText}<br>
            <strong>Mentor Faculty:</strong> ${facultyText}
        `;
        
        summaryDiv.style.display = 'block';
        assignBtn.disabled = false;
    } else {
        summaryDiv.style.display = 'none';
        assignBtn.disabled = true;
    }
}

// Add event listeners to update summary when faculty is selected
document.addEventListener('DOMContentLoaded', function() {
    const facultySelect = document.getElementById('mentorFaculty');
    if (facultySelect) {
        facultySelect.addEventListener('change', updateMentorSelectionSummary);
    }
});

// Handle mentor assignment
async function handleMentorAssign(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const formData = {
            class_id: document.getElementById('mentorClass').value,
            faculty_id: document.getElementById('mentorFaculty').value
        };

        const response = await fetch('/api/assign-mentor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Faculty assigned as mentor successfully!', 'success');
            resetMentorForm();
            loadMentorAssignments(); // Refresh assignments
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

// Reset mentor form
function resetMentorForm() {
    document.getElementById('mentorAssignForm').reset();
    
    // Reset dropdowns
    document.getElementById('mentorAcademicYear').innerHTML = '<option value="">Select Academic Year</option>';
    document.getElementById('mentorClass').innerHTML = '<option value="">Select Class</option>';
    document.getElementById('mentorFaculty').innerHTML = '<option value="">Select Faculty</option>';
    
    // Disable dependent dropdowns
    document.getElementById('mentorAcademicYear').disabled = true;
    document.getElementById('mentorClass').disabled = true;
    document.getElementById('mentorFaculty').disabled = true;
    document.getElementById('assignMentorBtn').disabled = true;
    
    // Hide summary
    document.getElementById('selectionSummary').style.display = 'none';
    
    // Reload departments
    loadDepartmentOptions('mentorDepartment');
}

// Load mentor assignments
async function loadMentorAssignments() {
    const tbody = document.getElementById('mentorAssignmentsTable');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading mentor assignments...</td></tr>';
        
        const response = await fetch('/api/mentor-assignments');
        const data = await response.json();

        if (data.success && data.assignments && data.assignments.length > 0) {
            let html = '';
            data.assignments.forEach(assignment => {
                html += `
                    <tr>
                        <td>
                            <strong>${assignment.department_name}</strong>
                        </td>
                        <td>
                            <span class="badge bg-primary">${assignment.year_range}</span>
                        </td>
                        <td>
                            <strong>${assignment.class_name} - Section ${assignment.section}</strong><br>
                            <small class="text-muted">${assignment.current_strength || 0}/${assignment.capacity || 60} students</small>
                        </td>
                        <td>
                            <div>
                                <strong>${assignment.first_name} ${assignment.last_name}</strong><br>
                                <small class="text-muted">${assignment.faculty_code} - ${assignment.designation}</small>
                            </div>
                        </td>
                        <td>
                            <div>
                                ${assignment.email ? `<small><i class="fas fa-envelope"></i> ${assignment.email}</small><br>` : ''}
                                ${assignment.phone ? `<small><i class="fas fa-phone"></i> ${assignment.phone}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-success">${assignment.student_count || 0}</span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeMentorAssignment(${assignment.id})" title="Remove Assignment">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No mentor assignments found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading mentor assignments:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading mentor assignments</td></tr>';
    }
}

// Remove mentor assignment
async function removeMentorAssignment(assignmentId) {
    if (!confirm('Are you sure you want to remove this mentor assignment?')) {
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(`/api/mentor-assignment/${assignmentId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Mentor assignment removed successfully!', 'success');
            loadMentorAssignments(); // Refresh assignments
        } else {
            showNotification(result.message || 'Error removing mentor assignment', 'error');
        }
    } catch (error) {
        console.error('Error removing mentor assignment:', error);
        showNotification('Error removing mentor assignment', 'error');
    } finally {
        showLoading(false);
    }
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
        code: document.getElementById('deptCode').value.trim().toUpperCase(),
        name: document.getElementById('deptName').value.trim(),
        description: `Department of ${document.getElementById('deptName').value.trim()}`,
        head_of_department: null
    };

    // Basic validation
    if (!formData.code || !formData.name) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        showLoading(true);
        const response = await fetch('/api/departments', {
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
            loadDashboardStats(); // Refresh dashboard stats
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
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-building fa-3x mb-3"></i>
                <p>No departments found.</p>
                <p>Create your first department using the form on the left.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="list-group">';
    
    departments.forEach(dept => {
        const createdDate = new Date(dept.created_at).toLocaleDateString();
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">
                            <i class="fas fa-building text-primary me-2"></i>
                            ${dept.name} (${dept.code})
                        </h6>
                        <p class="mb-1 text-muted">${dept.description || 'No description available'}</p>
                        <small class="text-muted">
                            <i class="fas fa-user-tie me-1"></i>Head: ${dept.head_of_department || 'Not assigned'} | 
                            <i class="fas fa-calendar me-1"></i>Created: ${createdDate}
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" onclick="openDepartmentDetailsPage(${dept.id})" title="View Department Details">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="editDepartment(${dept.id})" title="Edit Department">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteDepartment(${dept.id}, '${dept.name}')" title="Delete Department">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Open department details page
function openDepartmentDetailsPage(deptId) {
    window.open(`department-details.html?id=${deptId}`, '_blank');
}

async function viewDepartmentDetails(deptId) {
    try {
        showLoading(true);
        const response = await fetch(`/api/departments/${deptId}/details`);
        const data = await response.json();
        
        if (data.success) {
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
    
    modalTitle.textContent = `${department.name} (${department.code})`;
    
    let html = `
        <div class="row mb-4">
            <div class="col-md-8">
                <h6 class="text-primary"><i class="fas fa-info-circle me-2"></i>Department Information</h6>
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Code:</strong> ${department.code}</p>
                                <p><strong>Name:</strong> ${department.name}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Head:</strong> ${department.head_of_department || 'Not assigned'}</p>
                                <p><strong>Created:</strong> ${new Date(department.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p><strong>Description:</strong> ${department.description || 'No description available'}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <h6 class="text-primary"><i class="fas fa-plus me-2"></i>Add Academic Year</h6>
                <div class="card">
                    <div class="card-body">
                        <form id="academicYearForm">
                            <div class="mb-2">
                                <label class="form-label">Start Year</label>
                                <input type="number" class="form-control form-control-sm" id="startYear" min="2020" max="2030" value="2024" required>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">End Year</label>
                                <input type="number" class="form-control form-control-sm" id="endYear" min="2021" max="2035" value="2028" required>
                            </div>
                            <button type="button" class="btn btn-success btn-sm w-100" onclick="createAcademicYear(${department.id})">
                                <i class="fas fa-plus"></i> Add Year
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <h6 class="text-primary"><i class="fas fa-calendar me-2"></i>Academic Years</h6>
    `;
    
    if (academicYears && academicYears.length > 0) {
        html += '<div class="row">';
        academicYears.forEach(year => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-calendar-alt me-2"></i>${year.year_range}
                            </h6>
                            <span class="badge bg-light text-primary">${year.status}</span>
                        </div>
                        <div class="card-body">
                            <p class="card-text">
                                <small class="text-muted">
                                    Created: ${new Date(year.created_at).toLocaleDateString()}
                                </small>
                            </p>
                            <button class="btn btn-primary btn-sm me-2" onclick="viewAcademicYearClasses(${year.id}, '${year.year_range}')">
                                <i class="fas fa-list"></i> View Classes
                            </button>
                            <button class="btn btn-success btn-sm" onclick="showAddClassModal(${year.id}, '${year.year_range}')">
                                <i class="fas fa-plus"></i> Add Class
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No academic years found for this department.</p>
                <p>Create your first academic year using the form above.</p>
            </div>
        `;
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
        html += '<div id="classesContainer">';
        classes.forEach(cls => {
            html += `
                <div class="card mb-3" id="class-${cls.class_id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${cls.class_name} - Section ${cls.section || 'A'}</h6>
                            <p class="mb-1 text-muted">${cls.course_name || 'Course not specified'}</p>
                            <small class="text-muted">Mentor: ${cls.mentor_name || 'Not assigned'} | Students: ${cls.student_count || 0}</small>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="toggleClassStudents(${cls.class_id}, '${cls.class_name}')">
                            <i class="fas fa-users"></i> <span id="btn-text-${cls.class_id}">View Students</span>
                        </button>
                    </div>
                    <div class="card-body" id="students-container-${cls.class_id}" style="display: none;">
                        <div class="text-center">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <span class="ms-2">Loading students...</span>
                        </div>
                    </div>
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

// Toggle students display inline - show/hide students below class
async function toggleClassStudents(classId, className) {
    const container = document.getElementById(`students-container-${classId}`);
    const buttonText = document.getElementById(`btn-text-${classId}`);
    
    if (container.style.display === 'none') {
        // Show students
        container.style.display = 'block';
        buttonText.textContent = 'Hide Students';
        
        try {
            // Load students if not already loaded
            if (container.innerHTML.includes('Loading students...')) {
                console.log('Loading students for class:', classId);
                const response = await fetch(`/api/class/${classId}/students`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Students data received:', data);
                    
                    if (data.success && data.students) {
                        displayStudentsInline(data.students, classId, className);
                    } else {
                        container.innerHTML = '<div class="alert alert-warning">No students found in this class.</div>';
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('Error loading students:', error);
            container.innerHTML = `<div class="alert alert-danger">Error loading students: ${error.message}. Please try again.</div>`;
        }
    } else {
        // Hide students
        container.style.display = 'none';
        buttonText.textContent = 'View Students';
    }
}

// Display students inline below the class
function displayStudentsInline(students, classId, className) {
    const container = document.getElementById(`students-container-${classId}`);
    
    if (!students || students.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No students found in this class.</div>';
        return;
    }
    
    let html = `
        <div class="students-section">
            <div class="mb-3">
                <h6 class="text-primary">
                    <i class="fas fa-graduation-cap me-2"></i>Students in ${className} (${students.length} total)
                </h6>
                <hr class="mt-2 mb-3">
            </div>
            <div class="row">
    `;
    
    students.forEach((student, index) => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card student-card border-left-primary h-100">
                    <div class="card-body py-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-2">
                                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-size: 14px; font-weight: bold;">
                                        ${student.first_name.charAt(0)}${student.last_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h6 class="mb-0">${student.first_name} ${student.last_name}</h6>
                                        <small class="text-primary font-weight-bold">${student.register_number}</small>
                                    </div>
                                </div>
                                
                                <div class="student-info">
                                    <p class="mb-1 small">
                                        <i class="fas fa-envelope text-muted me-2"></i>${student.email}
                                    </p>
                                    ${student.phone ? `<p class="mb-1 small"><i class="fas fa-phone text-muted me-2"></i>${student.phone}</p>` : ''}
                                    <p class="mb-1 small">
                                        <i class="fas fa-venus-mars text-muted me-2"></i>${student.gender} |
                                        <i class="fas fa-calendar text-muted ms-2 me-1"></i>${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                                    </p>
                                    ${student.parent_name ? `<p class="mb-0 small text-success"><i class="fas fa-user-friends me-2"></i>Parent: ${student.parent_name}</p>` : ''}
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm" onclick="viewStudentDetails('${student.register_number}')" title="View Full Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    
    // Add summary information
    const studentsWithParents = students.filter(s => s.parent_name);
    const maleStudents = students.filter(s => s.gender === 'Male' || s.gender === 'male').length;
    const femaleStudents = students.filter(s => s.gender === 'Female' || s.gender === 'female').length;
    
    html += `
        <div class="mt-4 p-3 bg-light rounded">
            <h6 class="text-secondary mb-3">
                <i class="fas fa-chart-pie me-2"></i>Class Summary
            </h6>
            <div class="row text-center">
                <div class="col-md-3">
                    <div class="border-end">
                        <h5 class="text-primary mb-0">${students.length}</h5>
                        <small class="text-muted">Total Students</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="border-end">
                        <h5 class="text-info mb-0">${maleStudents}</h5>
                        <small class="text-muted">Male</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="border-end">
                        <h5 class="text-danger mb-0">${femaleStudents}</h5>
                        <small class="text-muted">Female</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <h5 class="text-success mb-0">${studentsWithParents.length}</h5>
                    <small class="text-muted">Parent Info Available</small>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Keep the old function for compatibility (but it won't be used with new interface)
async function viewClassStudents(classId, className) {
    try {
        showLoading(true);
        const response = await fetch(`/api/class/${classId}/students`);
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
                            <th>Phone</th>
                            <th>Gender</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.forEach(student => {
            html += `
                <tr>
                    <td><strong>${student.register_number}</strong></td>
                    <td>${student.first_name} ${student.last_name}</td>
                    <td>${student.email}</td>
                    <td>${student.phone || 'N/A'}</td>
                    <td>${student.gender}</td>
                    <td>${student.department_name || student.department}</td>
                    <td><span class="badge bg-success">${student.status || 'Active'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudentDetails('${student.register_number}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <small class="text-muted">Total Students: ${students.length}</small>
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

// View individual student details
async function viewStudentDetails(registerNumber) {
    try {
        showLoading(true);
        const response = await fetch(`/api/student/${registerNumber}`);
        
        if (response.ok) {
            const student = await response.json();
            displayStudentDetailsModal(student);
        } else {
            showNotification('Student not found', 'error');
        }
    } catch (error) {
        console.error('Error loading student details:', error);
        showNotification('Error loading student details', 'error');
    } finally {
        showLoading(false);
    }
}

// Display student details in a modal
function displayStudentDetailsModal(student) {
    const modalHTML = `
        <div class="modal fade" id="studentDetailsModal" tabindex="-1" aria-labelledby="studentDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="studentDetailsModalLabel">Student Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Personal Information</h6>
                                <table class="table table-borderless">
                                    <tr><th>Register Number:</th><td>${student.register_number}</td></tr>
                                    <tr><th>Name:</th><td>${student.first_name} ${student.last_name}</td></tr>
                                    <tr><th>Email:</th><td>${student.email}</td></tr>
                                    <tr><th>Phone:</th><td>${student.phone || 'N/A'}</td></tr>
                                    <tr><th>Date of Birth:</th><td>${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</td></tr>
                                    <tr><th>Gender:</th><td>${student.gender}</td></tr>
                                    <tr><th>Address:</th><td>${student.address || 'N/A'}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Academic Information</h6>
                                <table class="table table-borderless">
                                    <tr><th>Department:</th><td>${student.department_name || student.department}</td></tr>
                                    <tr><th>Class:</th><td>${student.class_name || 'N/A'} - ${student.section || 'N/A'}</td></tr>
                                    <tr><th>Academic Year:</th><td>${student.year_range || 'N/A'}</td></tr>
                                    <tr><th>Current Semester:</th><td>${student.current_semester || 'N/A'}</td></tr>
                                    <tr><th>Current Year:</th><td>${student.current_year || 'N/A'}</td></tr>
                                    <tr><th>Status:</th><td><span class="badge bg-success">${student.status || 'Active'}</span></td></tr>
                                </table>
                                
                                <h6 class="text-primary mt-3">Parent Information</h6>
                                <table class="table table-borderless">
                                    <tr><th>Parent Name:</th><td>${student.parent_name || 'N/A'}</td></tr>
                                    <tr><th>Parent Phone:</th><td>${student.parent_phone || 'N/A'}</td></tr>
                                    <tr><th>Parent Email:</th><td>${student.parent_email || 'N/A'}</td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editStudentDetails('${student.register_number}')">Edit Student</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('studentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
    modal.show();
}

// Edit department function
async function editDepartment(departmentId) {
    try {
        // Get department details first
        const response = await fetch(`/api/departments`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const department = data.departments.find(dept => dept.id === departmentId);
                if (department) {
                    // Fill the form with current data
                    document.getElementById('deptCode').value = department.code;
                    document.getElementById('deptName').value = department.name;
                    
                    // Change form to edit mode
                    const form = document.getElementById('departmentForm');
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.textContent = 'Update Department';
                    submitBtn.onclick = (e) => updateDepartment(e, departmentId);
                    
                    // Add cancel button
                    if (!form.querySelector('.cancel-edit-btn')) {
                        const cancelBtn = document.createElement('button');
                        cancelBtn.type = 'button';
                        cancelBtn.className = 'btn btn-secondary me-2 cancel-edit-btn';
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.onclick = cancelEdit;
                        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading department for edit:', error);
        showNotification('Error loading department details', 'error');
    }
}

// Update department function
async function updateDepartment(event, departmentId) {
    event.preventDefault();
    
    const formData = {
        code: document.getElementById('deptCode').value.trim().toUpperCase(),
        name: document.getElementById('deptName').value.trim(),
        description: `Department of ${document.getElementById('deptName').value.trim()}`
    };

    if (!formData.code || !formData.name) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(`/api/departments/${departmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('Department updated successfully!', 'success');
            cancelEdit();
            loadDepartments();
            loadDashboardStats();
        } else {
            showNotification(result.message || 'Error updating department', 'error');
        }
    } catch (error) {
        console.error('Error updating department:', error);
        showNotification('Error updating department', 'error');
    } finally {
        showLoading(false);
    }
}

// Cancel edit function
function cancelEdit() {
    const form = document.getElementById('departmentForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('.cancel-edit-btn');
    
    // Reset form
    resetDepartmentForm();
    
    // Reset submit button
    submitBtn.textContent = 'Create Department';
    submitBtn.onclick = null;
    
    // Remove cancel button
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

// Delete department function
async function deleteDepartment(departmentId, departmentName) {
    if (confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
        try {
            showLoading(true);
            const response = await fetch(`/api/departments/${departmentId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Department deleted successfully!', 'success');
                loadDepartments();
                loadDashboardStats();
            } else {
                showNotification(result.message || 'Error deleting department', 'error');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            showNotification('Error deleting department', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// View faculty details function
function viewFacultyDetails(facultyId) {
    const faculty = facultyList.find(f => f.id === facultyId);
    if (faculty) {
        const modalContent = `
            <div class="modal fade" id="facultyDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Faculty Details - ${faculty.first_name} ${faculty.last_name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary">Personal Information</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Faculty ID:</strong></td><td>${faculty.faculty_code}</td></tr>
                                        <tr><td><strong>Name:</strong></td><td>${faculty.first_name} ${faculty.last_name}</td></tr>
                                        <tr><td><strong>Email:</strong></td><td>${faculty.email}</td></tr>
                                        <tr><td><strong>Phone:</strong></td><td>${faculty.phone || 'N/A'}</td></tr>
                                        <tr><td><strong>Date of Birth:</strong></td><td>${faculty.date_of_birth ? new Date(faculty.date_of_birth).toLocaleDateString() : 'N/A'}</td></tr>
                                        <tr><td><strong>Gender:</strong></td><td>${faculty.gender || 'N/A'}</td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary">Professional Information</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Department:</strong></td><td>${faculty.department}</td></tr>
                                        <tr><td><strong>Designation:</strong></td><td>${faculty.designation}</td></tr>
                                        <tr><td><strong>Qualification:</strong></td><td>${faculty.qualification || 'N/A'}</td></tr>
                                        <tr><td><strong>Experience:</strong></td><td>${faculty.experience_years || 0} years</td></tr>
                                        <tr><td><strong>Date of Joining:</strong></td><td>${faculty.date_of_joining ? new Date(faculty.date_of_joining).toLocaleDateString() : 'N/A'}</td></tr>
                                        <tr><td><strong>Status:</strong></td><td><span class="badge bg-${faculty.status === 'active' ? 'success' : 'secondary'}">${faculty.status}</span></td></tr>
                                    </table>
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
        const existingModal = document.getElementById('facultyDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('facultyDetailsModal'));
        modal.show();
    }
}

// Create academic year for department
async function createAcademicYear(departmentId) {
    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    
    if (!startYear || !endYear) {
        showNotification('Please fill in both start and end years', 'error');
        return;
    }
    
    if (parseInt(endYear) <= parseInt(startYear)) {
        showNotification('End year must be greater than start year', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/departments/${departmentId}/academic-years`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_year: parseInt(startYear),
                end_year: parseInt(endYear)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Academic year created successfully!', 'success');
            // Refresh the department details
            viewDepartmentDetails(departmentId);
        } else {
            showNotification(result.message || 'Error creating academic year', 'error');
        }
    } catch (error) {
        console.error('Error creating academic year:', error);
        showNotification('Error creating academic year', 'error');
    } finally {
        showLoading(false);
    }
}

// View classes for an academic year
async function viewAcademicYearClasses(academicYearId, yearRange) {
    try {
        showLoading(true);
        const response = await fetch(`/api/academic-years/${academicYearId}/classes`);
        const data = await response.json();
        
        if (data.success) {
            displayClassesModal(data.classes, yearRange, academicYearId);
        } else {
            showNotification('Error loading classes', 'error');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes', 'error');
    } finally {
        showLoading(false);
    }
}

// Display classes modal
function displayClassesModal(classes, yearRange, academicYearId) {
    const modalContent = `
        <div class="modal fade" id="classesModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2"></i>Classes for ${yearRange}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-8">
                                <h6>Existing Classes</h6>
                            </div>
                            <div class="col-md-4 text-end">
                                <button class="btn btn-success btn-sm" onclick="showAddClassModal(${academicYearId}, '${yearRange}')">
                                    <i class="fas fa-plus"></i> Add New Class
                                </button>
                            </div>
                        </div>
                        
                        <div id="classesContainer">
                            ${classes.length > 0 ? generateClassesHTML(classes) : '<p class="text-muted text-center">No classes found. Add your first class using the button above.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('classesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('classesModal'));
    modal.show();
}

// Generate HTML for classes - updated to match new design without edit options
function generateClassesHTML(classes) {
    if (!classes || classes.length === 0) {
        return '<p class="text-muted text-center">No classes found.</p>';
    }
    
    let html = '<div id="classesContainer">';
    classes.forEach(cls => {
        html += `
            <div class="card mb-3" id="class-${cls.id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${cls.class_name} - Section ${cls.section || 'A'}</h6>
                        <p class="mb-1 text-muted">${cls.course_name || 'Course not specified'}</p>
                        <small class="text-muted">
                            Teacher: ${cls.class_teacher || 'Not assigned'} | 
                            Capacity: ${cls.capacity || 60} | 
                            Current: ${cls.current_strength || 0}
                        </small>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="toggleClassStudents(${cls.id}, '${cls.class_name}')">
                        <i class="fas fa-users"></i> <span id="btn-text-${cls.id}">View Students</span>
                    </button>
                </div>
                <div class="card-body" id="students-container-${cls.id}" style="display: none;">
                    <div class="text-center">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="ms-2">Loading students...</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Show add class modal
function showAddClassModal(academicYearId, yearRange) {
    const modalContent = `
        <div class="modal fade" id="addClassModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-plus me-2"></i>Add New Class for ${yearRange}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addClassForm">
                            <div class="mb-3">
                                <label for="className" class="form-label">Class Name *</label>
                                <input type="text" class="form-control" id="className" placeholder="e.g., CSE, ECE, MECH" required>
                                <div class="form-text">Enter the department abbreviation or course name</div>
                            </div>
                            <div class="mb-3">
                                <label for="classSection" class="form-label">Section *</label>
                                <input type="text" class="form-control" id="classSection" placeholder="e.g., A, B, C" required>
                                <div class="form-text">Enter the section letter or number</div>
                            </div>
                            <div class="mb-3">
                                <label for="classCapacity" class="form-label">Capacity</label>
                                <input type="number" class="form-control" id="classCapacity" value="60" min="1" max="200">
                                <div class="form-text">Maximum number of students</div>
                            </div>
                            <div class="mb-3">
                                <label for="classTeacher" class="form-label">Class Teacher</label>
                                <input type="text" class="form-control" id="classTeacher" placeholder="Teacher name (optional)">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="createClass(${academicYearId}, '${yearRange}')">
                            <i class="fas fa-plus"></i> Create Class
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('addClassModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

// Create class
async function createClass(academicYearId, yearRange) {
    const className = document.getElementById('className').value.trim();
    const section = document.getElementById('classSection').value.trim();
    const capacity = document.getElementById('classCapacity').value;
    const classTeacher = document.getElementById('classTeacher').value.trim();
    
    if (!className || !section) {
        showNotification('Class name and section are required', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/academic-years/${academicYearId}/classes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                class_name: className.toUpperCase(),
                section: section.toUpperCase(),
                capacity: parseInt(capacity) || 60,
                class_teacher: classTeacher || null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Class created successfully!', 'success');
            // Close add class modal
            bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            // Refresh classes view
            viewAcademicYearClasses(academicYearId, yearRange);
        } else {
            showNotification(result.message || 'Error creating class', 'error');
        }
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification('Error creating class', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete class
async function deleteClass(classId) {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/classes/${classId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Class deleted successfully!', 'success');
            // Refresh the current modal content
            location.reload(); // Simple solution for now
        } else {
            showNotification(result.message || 'Error deleting class', 'error');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        showNotification('Error deleting class', 'error');
    } finally {
        showLoading(false);
    }
}

// Add department form event listener
document.addEventListener('DOMContentLoaded', function() {
    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
        departmentForm.addEventListener('submit', createDepartment);
    }
});

// Navigation functions for detailed views
function openStudentsDetails() {
    console.log('📚 Opening students details view...');
    window.open('students-details.html', '_blank');
}

function openFacultyDetails() {
    console.log('👨‍🏫 Opening faculty details view...');
    window.open('faculty-details.html', '_blank');
}

function openDepartmentsDetails() {
    console.log('🏢 Opening departments details view...');
    window.open('departments-details.html', '_blank');
}

// ================================
// SUBJECTS MANAGEMENT FUNCTIONS
// ================================

let selectedDepartmentForSubjects = null;

// Load departments for subjects page
async function loadSubjectDepartments() {
    const departmentsList = document.getElementById('departmentsList');
    
    try {
        console.log('🏢 Loading departments for subjects...');
        
        if (departments.length === 0) {
            await loadDepartments();
        }
        
        if (departments.length === 0) {
            departmentsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <p>No departments found</p>
                </div>
            `;
            return;
        }
        
        let departmentsHtml = '<div class="list-group">';
        
        departments.forEach(dept => {
            departmentsHtml += `
                <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
                        onclick="openDepartmentSubjects(${dept.id}, '${dept.name}', '${dept.code}')">
                    <div>
                        <h6 class="mb-1">${dept.name}</h6>
                        <small class="text-muted">${dept.code}</small>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        });
        
        departmentsHtml += '</div>';
        departmentsList.innerHTML = departmentsHtml;
        
        console.log(`✅ Loaded ${departments.length} departments`);
    } catch (error) {
        console.error('❌ Error loading departments:', error);
        departmentsList.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Error loading departments</p>
            </div>
        `;
    }
}

// Open department subjects view
function openDepartmentSubjects(departmentId, departmentName, departmentCode) {
    selectedDepartmentForSubjects = { id: departmentId, name: departmentName, code: departmentCode };
    
    // Hide subjects main section and show department subjects section
    document.getElementById('subjects').classList.remove('active');
    document.getElementById('department-subjects').classList.add('active');
    
    // Update title
    document.getElementById('departmentSubjectsTitle').textContent = `${departmentName} (${departmentCode}) - Subjects`;
    document.getElementById('departmentSubjectsSubtitle').textContent = 'Select a semester to view subjects';
    
    // Load subject counts for all semesters
    loadAllSemesterCounts(departmentId);
    
    console.log(`📚 Opened subjects for department: ${departmentName}`);
}

// Go back to subjects main page
function backToSubjectsMain() {
    document.getElementById('department-subjects').classList.remove('active');
    document.getElementById('subjects').classList.add('active');
    selectedDepartmentForSubjects = null;
    
    // Clear active semester selection
    const semesterItems = document.querySelectorAll('#semestersList .list-group-item');
    semesterItems.forEach(item => item.classList.remove('active'));
    
    // Clear subjects display
    document.getElementById('semesterSubjectsDisplay').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-mouse-pointer fa-3x mb-3"></i>
            <p>Click on a semester from the left to view subjects</p>
        </div>
    `;
}

// Load subject counts for all semesters
async function loadAllSemesterCounts(departmentId) {
    try {
        for (let semester = 1; semester <= 8; semester++) {
            const response = await fetch(`/api/subjects/${departmentId}/2024-25/${semester}`);
            const data = await response.json();
            
            const countElement = document.getElementById(`sem${semester}Count`);
            if (countElement) {
                countElement.textContent = data.success ? data.subjects.length : 0;
            }
        }
    } catch (error) {
        console.error('❌ Error loading semester counts:', error);
    }
}

// Load subjects for a specific semester
async function loadSemesterSubjects(semester) {
    if (!selectedDepartmentForSubjects) {
        console.error('❌ No department selected');
        return;
    }
    
    // Update active semester
    const semesterItems = document.querySelectorAll('#semestersList .list-group-item');
    semesterItems.forEach(item => item.classList.remove('active'));
    event.target.closest('.list-group-item').classList.add('active');
    
    // Update header
    document.getElementById('semesterSubjectsTitle').innerHTML = 
        `<i class="fas fa-list me-2"></i>Semester ${semester} Subjects`;
    
    const semesterSubjectsDisplay = document.getElementById('semesterSubjectsDisplay');
    
    try {
        console.log(`📚 Loading subjects for semester ${semester}`);
        semesterSubjectsDisplay.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading subjects...</p>
            </div>
        `;
        
        const response = await fetch(`/api/subjects/${selectedDepartmentForSubjects.id}/2024-25/${semester}`);
        const data = await response.json();
        
        if (data.success) {
            if (data.subjects.length === 0) {
                semesterSubjectsDisplay.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-book-open fa-3x mb-3"></i>
                        <p>No subjects found for Semester ${semester}</p>
                        <small class="text-muted">Use the "Create New Subject" form to add subjects</small>
                    </div>
                `;
            } else {
                let subjectsHtml = `
                    <div class="mb-3">
                        <h6 class="text-primary">
                            <i class="fas fa-graduation-cap me-2"></i>
                            ${selectedDepartmentForSubjects.name} - Semester ${semester} (2024-25)
                        </h6>
                        <small class="text-muted">${data.subjects.length} subjects found</small>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    <th>Faculty</th>
                                    <th>Academic Year</th>
                                    <th>Credits</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.subjects.forEach(subject => {
                    const facultyInfo = subject.faculty.name !== 'Not Assigned' 
                        ? `<div>
                             <strong>${subject.faculty.name}</strong><br>
                             <small class="text-muted">${subject.faculty.code}</small><br>
                             <small class="text-muted">${subject.faculty.email}</small>
                           </div>`
                        : '<span class="text-warning"><i class="fas fa-user-times me-1"></i>Not Assigned</span>';
                    
                    const typeClass = subject.type === 'Theory+Practical' ? 'bg-primary' : 
                                    subject.type === 'Practical' ? 'bg-success' : 'bg-info';
                    
                    subjectsHtml += `
                        <tr>
                            <td><strong class="text-primary">${subject.code}</strong></td>
                            <td>${subject.name}</td>
                            <td>${facultyInfo}</td>
                            <td>
                                <span class="badge bg-info">${subject.academicYear || '2024-25'}</span>
                            </td>
                            <td>
                                <span class="badge bg-secondary fs-6">${subject.credits}</span>
                            </td>
                            <td>
                                <span class="badge ${typeClass}">${subject.type}</span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="editSubject(${subject.id})" title="Edit Subject">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteSubject(${subject.id}, '${subject.code}')" title="Delete Subject">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                subjectsHtml += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                semesterSubjectsDisplay.innerHTML = subjectsHtml;
            }
            
            console.log(`✅ Loaded ${data.subjects.length} subjects for semester ${semester}`);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Error loading semester subjects:', error);
        semesterSubjectsDisplay.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Error loading subjects</p>
                <small>${error.message}</small>
            </div>
        `;
        showNotification('Error loading subjects', 'error');
    }
}

// Load faculty for selected department in create form
async function loadDepartmentFaculty() {
    const departmentSelect = document.getElementById('newSubjectDepartment');
    const facultySelect = document.getElementById('newSubjectFaculty');
    
    const departmentId = departmentSelect.value;
    
    if (!departmentId) {
        facultySelect.innerHTML = '<option value="">Select Faculty</option>';
        facultySelect.disabled = true;
        return;
    }
    
    try {
        console.log(`👨‍🏫 Loading faculty for department ${departmentId}`);
        
        // Make sure faculty list is loaded
        if (facultyList.length === 0) {
            await loadFaculty();
        }
        
        facultySelect.innerHTML = '<option value="">Select Faculty</option>';
        
        // Filter faculty by department
        let departmentFaculty = facultyList.filter(faculty => {
            const selectedDept = departments.find(d => d.id == departmentId);
            return selectedDept && faculty.department === selectedDept.name;
        });
        
        if (departmentFaculty.length === 0) {
            facultySelect.innerHTML += '<option value="" disabled>No faculty found for this department</option>';
        } else {
            departmentFaculty.forEach(faculty => {
                facultySelect.innerHTML += `
                    <option value="${faculty.id}">
                        ${faculty.name} - ${faculty.designation}
                    </option>
                `;
            });
        }
        
        facultySelect.disabled = false;
        console.log(`✅ Loaded ${departmentFaculty.length} faculty members`);
        
    } catch (error) {
        console.error('❌ Error loading department faculty:', error);
        facultySelect.innerHTML = '<option value="">Error loading faculty</option>';
        showNotification('Error loading faculty', 'error');
    }
}

// Add new subject
document.addEventListener('DOMContentLoaded', function() {
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                subjectCode: document.getElementById('newSubjectCode').value,
                subjectName: document.getElementById('newSubjectName').value,
                departmentId: document.getElementById('newSubjectDepartment').value,
                facultyId: document.getElementById('newSubjectFaculty').value,
                semester: document.getElementById('newSubjectSemester').value,
                academicYear: document.getElementById('newSubjectAcademicYear').value,
                credits: document.getElementById('newSubjectCredits').value,
                subjectType: document.getElementById('newSubjectType').value
            };
            
            try {
                showLoading(true);
                console.log('📝 Adding new subject:', formData);
                
                const response = await fetch('/api/subjects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Subject added successfully!', 'success');
                    resetSubjectForm();
                    
                    // Refresh semester counts if we're in department view
                    if (selectedDepartmentForSubjects) {
                        loadAllSemesterCounts(selectedDepartmentForSubjects.id);
                        
                        // Refresh current semester view if active
                        const activeSemester = document.querySelector('#semestersList .list-group-item.active');
                        if (activeSemester) {
                            const semester = activeSemester.onclick.toString().match(/loadSemesterSubjects\((\d+)\)/)[1];
                            loadSemesterSubjects(parseInt(semester));
                        }
                    }
                } else {
                    showNotification(result.message || 'Error adding subject', 'error');
                }
            } catch (error) {
                console.error('❌ Error adding subject:', error);
                showNotification('Error adding subject', 'error');
            } finally {
                showLoading(false);
            }
        });
    }
});

// Reset subject form
function resetSubjectForm() {
    document.getElementById('addSubjectForm').reset();
    document.getElementById('newSubjectCredits').value = '3';
    
    // Reset faculty dropdown
    const facultySelect = document.getElementById('newSubjectFaculty');
    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    facultySelect.disabled = true;
}

// Delete subject
async function deleteSubject(subjectId, subjectCode) {
    if (!confirm(`Are you sure you want to delete subject "${subjectCode}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        showLoading(true);
        console.log(`🗑️ Deleting subject ${subjectId}`);
        
        const response = await fetch(`/api/subjects/${subjectId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Subject deleted successfully!', 'success');
            
            // Refresh semester counts if we're in department view
            if (selectedDepartmentForSubjects) {
                loadAllSemesterCounts(selectedDepartmentForSubjects.id);
                
                // Refresh current semester view if active
                const activeSemester = document.querySelector('#semestersList .list-group-item.active');
                if (activeSemester) {
                    const semester = activeSemester.onclick.toString().match(/loadSemesterSubjects\((\d+)\)/)[1];
                    loadSemesterSubjects(parseInt(semester));
                }
            }
        } else {
            showNotification(result.message || 'Error deleting subject', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting subject:', error);
        showNotification('Error deleting subject', 'error');
    } finally {
        showLoading(false);
    }
}

// Edit subject function
function editSubject(subjectId) {
    // This is a placeholder for edit functionality
    // In a full implementation, you would open a modal or form with the subject data
    showNotification('Edit functionality coming soon!', 'info');
    console.log(`📝 Edit subject requested for ID: ${subjectId}`);
}

// Load faculty data for subjects
async function loadFaculty() {
    try {
        console.log('👨‍🏫 Loading faculty data...');
        const response = await fetch('/api/faculty-list');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                facultyList = data.faculty.map(faculty => ({
                    id: faculty.id,
                    name: `${faculty.first_name} ${faculty.last_name}`,
                    first_name: faculty.first_name,
                    last_name: faculty.last_name,
                    faculty_code: faculty.faculty_code,
                    department: faculty.department,
                    designation: faculty.designation,
                    email: faculty.email,
                    phone: faculty.phone
                }));
                console.log(`✅ Loaded ${facultyList.length} faculty members`);
                return facultyList;
            }
        }
        throw new Error('Failed to load faculty data');
    } catch (error) {
        console.error('❌ Error loading faculty:', error);
        facultyList = [];
        return [];
    }
}

// Initialize subjects section when needed
function initializeSubjectsSection() {
    console.log('📚 Initializing subjects section...');
    
    // Load departments for create form and department list
    loadDepartments().then(() => {
        const newSubjectDeptSelect = document.getElementById('newSubjectDepartment');
        
        if (departments.length > 0 && newSubjectDeptSelect) {
            // Populate new subject department dropdown
            newSubjectDeptSelect.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                newSubjectDeptSelect.innerHTML += `<option value="${dept.id}">${dept.name} (${dept.code})</option>`;
            });
        }
        
        // Load departments list on the right side
        loadSubjectDepartments();
    });
    
    // Populate academic year dropdown
    const academicYearSelect = document.getElementById('newSubjectAcademicYear');
    if (academicYearSelect) {
        academicYearSelect.innerHTML = `
            <option value="">Select Academic Year</option>
            <option value="2023-24">2023-24</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
        `;
    }
    
    // Load faculty data for later use
    loadFaculty().then(() => {
        console.log('✅ Faculty data loaded for subjects section');
    });
}