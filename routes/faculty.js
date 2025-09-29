const express = require('express');
const router = express.Router();

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
}

// Role-based middleware
function requireRole(roles) {
    return (req, res, next) => {
        if (req.session && req.session.user && roles.includes(req.session.user.type)) {
            return next();
        } else {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
    };
}

// Create faculty route
router.post('/create-faculty', async (req, res) => {
    try {
        const {
            faculty_code,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            department,
            designation,
            qualification,
            experience_years,
            date_of_joining,
            password
        } = req.body;

        // Validate required fields
        if (!faculty_code || !first_name || !last_name || !email || !department || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: Faculty Code, Name, Email, Department, and Designation are required'
            });
        }

        // Check if faculty already exists
        const [existingFaculty] = await req.dbPool.execute(
            'SELECT * FROM faculty WHERE faculty_code = ? OR email = ?',
            [faculty_code, email]
        );

        if (existingFaculty.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Faculty with this code or email already exists'
            });
        }

        // Get department info
        const [departmentResult] = await req.dbPool.execute(
            'SELECT id, dept_name, dept_code FROM departments WHERE id = ?',
            [department]
        );

        if (departmentResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        const departmentName = departmentResult[0].dept_name;
        const departmentCode = departmentResult[0].dept_code;
        const departmentId = departmentResult[0].id;
        const facultyPassword = password || faculty_code;

        // Insert faculty with all form data, handle empty date_of_joining
        const joiningDate = date_of_joining && date_of_joining.trim() !== '' ? date_of_joining : new Date().toISOString().split('T')[0];
        
        await req.dbPool.execute(
            `INSERT INTO faculty (
                faculty_code, first_name, last_name, email, phone,
                department, designation, qualification,
                experience_years, date_of_joining, password, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
                faculty_code, first_name, last_name, email, phone,
                departmentCode, designation, qualification,
                experience_years || 0, joiningDate, facultyPassword
            ]
        );

        // If designation is HOD, update the department table
        if (designation === 'HOD' || designation === 'Head of Department (HOD)') {
            const hodName = `${first_name} ${last_name}`;
            
            await req.dbPool.execute(
                'UPDATE departments SET head_of_department = ? WHERE id = ?',
                [hodName, departmentId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Faculty account created successfully',
            faculty: {
                faculty_code,
                name: `${first_name} ${last_name}`,
                email,
                department: departmentName,
                designation
            }
        });

    } catch (error) {
        console.error('Error creating faculty:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                message: 'Faculty with this code or email already exists'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
});

// Get all faculty with details
router.get('/faculty-list', async (req, res) => {
    try {
        const [faculty] = await req.dbPool.execute(`
            SELECT 
                f.id, f.faculty_code, f.first_name, f.last_name, f.email, f.phone,
                f.department, f.designation, f.qualification,
                f.experience_years, f.date_of_joining, f.status, f.created_at,
                d.dept_name, d.dept_code
            FROM faculty f
            LEFT JOIN departments d ON f.department = d.dept_code
            ORDER BY f.created_at DESC
        `);

        res.json({
            success: true,
            faculty
        });

    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get faculty by department
router.get('/faculty-by-department/:departmentId', async (req, res) => {
    try {
        const { departmentId } = req.params;
        
        // Get department info first
        const [departmentResult] = await req.dbPool.execute(
            'SELECT dept_name, dept_code FROM departments WHERE id = ?',
            [departmentId]
        );

        if (departmentResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const departmentName = departmentResult[0].dept_name;
        const departmentCode = departmentResult[0].dept_code;

        const [faculty] = await req.dbPool.execute(
            'SELECT * FROM faculty WHERE department = ? AND status = "active" ORDER BY designation, first_name',
            [departmentCode]
        );

        res.json({
            success: true,
            faculty,
            departmentName
        });

    } catch (error) {
        console.error('Error fetching faculty by department:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create mentor assignments table if it doesn't exist
router.get('/init-mentor-table', async (req, res) => {
    try {
        await req.dbPool.execute(`
            CREATE TABLE IF NOT EXISTS mentor_assignments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                class_id INT NOT NULL,
                faculty_id INT NOT NULL,
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('active', 'inactive') DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_class_mentor (class_id),
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
            )
        `);

        res.json({
            success: true,
            message: 'Mentor assignments table initialized'
        });

    } catch (error) {
        console.error('Error initializing mentor table:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Assign mentor to class
router.post('/assign-mentor', async (req, res) => {
    try {
        const { class_id, faculty_id, notes } = req.body;

        if (!class_id || !faculty_id) {
            return res.status(400).json({
                success: false,
                message: 'Class ID and Faculty ID are required'
            });
        }

        // Check if class exists
        const [classResult] = await req.dbPool.execute(
            `SELECT c.*, ay.year_range, d.dept_name as department_name 
             FROM classes c 
             JOIN academic_years ay ON c.academic_year_id = ay.id 
             JOIN departments d ON c.department_id = d.id 
             WHERE c.id = ?`,
            [class_id]
        );

        if (classResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if faculty exists
        const [facultyResult] = await req.dbPool.execute(
            'SELECT * FROM faculty WHERE id = ? AND status = "active"',
            [faculty_id]
        );

        if (facultyResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found or inactive'
            });
        }

        // Check if class already has any mentor record (active or inactive)
        const [existingMentor] = await req.dbPool.execute(
            'SELECT * FROM mentor_assignments WHERE class_id = ?',
            [class_id]
        );

        if (existingMentor.length > 0) {
            // Update existing assignment (reactivate if inactive)
            await req.dbPool.execute(
                'UPDATE mentor_assignments SET faculty_id = ?, notes = ?, status = "active", updated_at = CURRENT_TIMESTAMP WHERE class_id = ?',
                [faculty_id, notes || null, class_id]
            );
        } else {
            // Create new assignment
            await req.dbPool.execute(
                'INSERT INTO mentor_assignments (class_id, faculty_id, notes) VALUES (?, ?, ?)',
                [class_id, faculty_id, notes || null]
            );
        }

        const classInfo = classResult[0];
        const facultyInfo = facultyResult[0];

        res.json({
            success: true,
            message: 'Mentor assigned successfully',
            assignment: {
                class: `${classInfo.class_name} - Section ${classInfo.section}`,
                academic_year: classInfo.year_range,
                department: classInfo.department_name,
                mentor: `${facultyInfo.first_name} ${facultyInfo.last_name}`,
                faculty_code: facultyInfo.faculty_code
            }
        });

    } catch (error) {
        console.error('Error assigning mentor:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get all mentor assignments
router.get('/mentor-assignments', async (req, res) => {
    try {
        const [assignments] = await req.dbPool.execute(`
            SELECT 
                ma.id, ma.assignment_date, ma.status,
                c.class_name, c.section, c.total_students,
                ay.year_range,
                d.dept_name as department_name,
                f.first_name, f.last_name, f.faculty_code, f.email, f.phone, f.designation,
                (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON c.department_id = d.id
            JOIN faculty f ON ma.faculty_id = f.id
            WHERE ma.status = 'active'
            ORDER BY d.dept_name, ay.year_range, c.class_name, c.section
        `);

        res.json({
            success: true,
            assignments
        });

    } catch (error) {
        console.error('Error fetching mentor assignments:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove mentor assignment
router.delete('/mentor-assignment/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await req.dbPool.execute(
            'UPDATE mentor_assignments SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mentor assignment not found'
            });
        }

        res.json({
            success: true,
            message: 'Mentor assignment removed successfully'
        });

    } catch (error) {
        console.error('Error removing mentor assignment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all faculty with detailed information for dashboard
router.get('/faculty/all-details', async (req, res) => {
    try {
        const [faculty] = await req.dbPool.execute(`
            SELECT 
                f.id,
                f.faculty_code,
                f.first_name,
                f.last_name,
                f.email,
                f.phone,
                f.department,
                f.designation,
                f.qualification,
                f.experience_years,
                f.date_of_joining,
                f.status,
                f.created_at,
                d.dept_name,
                d.dept_code
            FROM faculty f
            LEFT JOIN departments d ON f.department = d.dept_code
            WHERE f.status = 'active'
            ORDER BY f.faculty_code
        `);

        console.log('👨‍🏫 Fetched', faculty.length, 'faculty for detailed view');

        res.json({
            success: true,
            faculty: faculty,
            count: faculty.length
        });

    } catch (error) {
        console.error('Error fetching all faculty details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Faculty dashboard stats - for the logged-in faculty
router.get('/faculty/dashboard-stats', async (req, res) => {
    try {
        // Debug: Log session data
        console.log('🔍 Dashboard Stats - Session:', req.session);
        console.log('🔍 Dashboard Stats - User:', req.session?.user);
        
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            console.log('❌ Dashboard Stats - Authentication failed');
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        const facultyId = req.session.user.id;
        console.log('✅ Dashboard Stats - Faculty ID:', facultyId);

        // Get the classes mentored by this faculty
        const [mentorClasses] = await req.dbPool.execute(`
            SELECT 
                c.id as class_id,
                c.class_name,
                c.section,
                COUNT(s.id) as student_count
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            LEFT JOIN students s ON s.class_id = c.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            GROUP BY c.id, c.class_name, c.section
        `, [facultyId]);

        // Calculate total students in faculty's mentored classes
        const totalStudents = mentorClasses.reduce((sum, cls) => sum + cls.student_count, 0);

        // Since certificates table doesn't exist and no CGPA field, set to 0
        let totalCertificates = 0;
        let pendingVerifications = 0;
        let averageCGPA = 0;

        res.json({
            success: true,
            totalStudents,
            totalCertificates,
            pendingVerifications,
            averageCGPA: isNaN(averageCGPA) ? 0 : averageCGPA
        });

    } catch (error) {
        console.error('Error fetching faculty dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get students for the faculty's mentored classes
router.get('/faculty/my-students', async (req, res) => {
    try {
        // Debug: Log session data
        console.log('🔍 My Students - Session:', req.session);
        console.log('🔍 My Students - User:', req.session?.user);
        
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            console.log('❌ My Students - Authentication failed');
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        const facultyId = req.session.user.id;
        console.log('✅ My Students - Faculty ID:', facultyId);

        // Get all students in classes mentored by this faculty
        const [students] = await req.dbPool.execute(`
            SELECT 
                s.id as student_id,
                s.register_number,
                s.first_name,
                s.last_name,
                s.email,
                0 as current_cgpa,
                s.status as enrollment_status,
                c.id as class_id,
                c.class_name,
                CONCAT(c.class_name, ' - Section ', c.section) as course_name,
                    d.dept_name as dept_name,
                0 as total_certificates
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN students s ON s.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON ay.department_id = d.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            ORDER BY c.class_name, s.first_name, s.last_name
        `, [facultyId]);

        res.json(students);

    } catch (error) {
        console.error('Error fetching faculty students:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get classes/courses mentored by the faculty
router.get('/faculty/my-classes', async (req, res) => {
    try {
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        const facultyId = req.session.user.id;

        // Get classes mentored by this faculty
        const [classes] = await req.dbPool.execute(`
            SELECT 
                c.id as class_id,
                c.class_name,
                c.section,
                c.capacity as max_students,
                c.current_strength as current_students,
                c.id as course_id,
                CONCAT(c.class_name, ' - Section ', c.section) as course_name,
                    d.dept_name as dept_name,
                ay.year_range as year_name,
                1 as current_semester,
                ma.assignment_date,
                ma.notes
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON ay.department_id = d.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            ORDER BY c.class_name, c.section
        `, [facultyId]);

        res.json(classes);

    } catch (error) {
        console.error('Error fetching faculty classes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get recent activities for faculty dashboard
router.get('/faculty/recent-activities', async (req, res) => {
    try {
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        const facultyId = req.session.user.id;

        // Get recent activities from students in faculty's classes
        const [activities] = await req.dbPool.execute(`
            SELECT 
                s.id as student_id,
                CONCAT(s.first_name, ' ', s.last_name) as name,
                s.email,
                s.register_number,
                CONCAT(c.class_name, ' - Section ', c.section) as course,
                0 as cgpa,
                s.created_at as last_activity,
                s.status as status
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN students s ON s.class_id = c.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 10
        `, [facultyId]);

        res.json(activities);

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get certificates for faculty's students (placeholder since certificates table doesn't exist)
router.get('/faculty/certificates', async (req, res) => {
    try {
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        // Since certificates table doesn't exist, return empty array
        res.json([]);

    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Verify certificate (placeholder since certificates table doesn't exist)
router.post('/faculty/verify-certificate/:certId', async (req, res) => {
    try {
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        // Since certificates table doesn't exist, return placeholder response
        res.json({
            success: false,
            message: 'Certificate verification feature not yet implemented'
        });

    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get user profile for session validation
router.get('/user-profile', async (req, res) => {
    try {
        console.log('🔍 User Profile - Session:', req.session);
        console.log('🔍 User Profile - User:', req.session?.user);
        
        if (!req.session.user) {
            console.log('❌ User Profile - Not authenticated');
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        console.log('✅ User Profile - Authenticated:', req.session.user);

        // Return user info from session
        res.json({
            success: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                firstName: req.session.user.name ? req.session.user.name.split(' ')[0] : '',
                lastName: req.session.user.name ? req.session.user.name.split(' ').slice(1).join(' ') : '',
                type: req.session.user.type,
                department: req.session.user.department,
                designation: req.session.user.designation
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get reports data for faculty
router.get('/faculty/reports', async (req, res) => {
    try {
        // Get current user from session
        if (!req.session.user || req.session.user.type !== 'faculty') {
            return res.status(401).json({
                success: false,
                message: 'Faculty authentication required'
            });
        }

        const facultyId = req.session.user.id;

        // Get department stats for faculty's students
        const [departmentStats] = await req.dbPool.execute(`
            SELECT 
                d.dept_name as dept_name,
                COUNT(s.id) as student_count
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN students s ON s.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON ay.department_id = d.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            GROUP BY d.id, d.dept_name
            ORDER BY student_count DESC
        `, [facultyId]);

        // Since CGPA field doesn't exist, create empty CGPA data
        const cgpaData = [];

        // Since certificates table doesn't exist, create empty analytics
        const certAnalytics = [];

        // Format CGPA distribution
        const cgpaDistribution = {};
        cgpaData.forEach(row => {
            cgpaDistribution[row.cgpa_range] = row.count;
        });

        // Format certificate analytics (empty since certificates table doesn't exist)
        const certificateAnalytics = {};

        res.json({
            departmentStats,
            cgpaDistribution,
            certificateAnalytics
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Academic Performance Management Routes

// Get academic years
router.get('/faculty/academic-years', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        console.log('🎓 Academic Years API called');
        const [academicYears] = await req.dbPool.execute(
            'SELECT id, year_range as year_name FROM academic_years WHERE status = "active" ORDER BY start_year DESC'
        );
        
        console.log('🎓 Academic Years found:', academicYears);
        res.json(academicYears);
    } catch (error) {
        console.error('❌ Academic Years Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading academic years'
        });
    }
});

// Get subjects by semester and academic year
router.get('/faculty/subjects', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { semester, academic_year } = req.query;
        
        if (!semester) {
            return res.status(400).json({
                success: false,
                message: 'Semester is required'
            });
        }
        
        let query = 'SELECT * FROM subjects WHERE semester = ?';
        let params = [semester];
        
        // Add academic year filter if provided
        if (academic_year) {
            // Handle different academic year formats
            // Convert "2024 - 2028" to "2024-25" for subjects table
            let academicYearForSubjects = academic_year;
            if (academic_year.includes(' - ')) {
                const startYear = academic_year.split(' - ')[0];
                const nextYear = (parseInt(startYear) + 1).toString().slice(-2);
                academicYearForSubjects = `${startYear}-${nextYear}`;
            }
            
            console.log('📚 Subjects API - Original academic_year:', academic_year);
            console.log('📚 Subjects API - Converted academic_year:', academicYearForSubjects);
            
            query += ' AND academic_year = ?';
            params.push(academicYearForSubjects);
        }
        
        query += ' ORDER BY subject_name';
        
        console.log('📚 Subjects Query:', query);
        console.log('📚 Subjects Params:', params);
        
        const [subjects] = await req.dbPool.execute(query, params);
        
        console.log('📚 Subjects Found:', subjects);
        res.json(subjects);
    } catch (error) {
        console.error('❌ Subjects Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading subjects'
        });
    }
});

// Add internal assessment
router.post('/faculty/add-internal-assessment', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { iaNumber, subjectId, academicYearId, semester } = req.body;
        const facultyId = req.session.user.id;
        
        console.log('📋 Add IA Request Body:', req.body);
        console.log('📋 Extracted values:', { iaNumber, subjectId, academicYearId, semester, facultyId });
        
        // Get faculty's class
        const [mentorAssignments] = await req.dbPool.execute(
            'SELECT class_id FROM mentor_assignments WHERE faculty_id = ? AND status = ?',
            [facultyId, 'active']
        );
        
        if (mentorAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No class assigned to this faculty'
            });
        }
        
        const classId = mentorAssignments[0].class_id;
        
        // Check if IA already exists
        const [existing] = await req.dbPool.execute(
            `SELECT id FROM internal_assessments 
             WHERE ia_number = ? AND subject_id = ? AND academic_year_id = ? 
             AND semester = ? AND class_id = ?`,
            [iaNumber, subjectId, academicYearId, semester, classId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This Internal Assessment already exists'
            });
        }
        
        // Add internal assessment
        const [result] = await req.dbPool.execute(
            `INSERT INTO internal_assessments 
             (ia_number, subject_id, academic_year_id, semester, class_id, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [iaNumber, subjectId, academicYearId, semester, classId, facultyId]
        );
        
        // Get students in the class and create mark entries
        const [students] = await req.dbPool.execute(
            'SELECT id FROM students WHERE class_id = ? AND status = "active"',
            [classId]
        );
        
        // Insert initial marks entries for all students
        for (const student of students) {
            await req.dbPool.execute(
                `INSERT INTO student_marks (student_id, internal_assessment_id, marks_obtained, attendance)
                 VALUES (?, ?, 0, 'Present')`,
                [student.id, result.insertId]
            );
        }
        
        res.json({
            success: true,
            message: 'Internal Assessment added successfully'
        });
        
    } catch (error) {
        console.error('❌ Add IA Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding internal assessment'
        });
    }
});

// Get internal assessments
router.get('/faculty/internal-assessments', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { academicYearId, semester } = req.query;
        const facultyId = req.session.user.id;
        
        console.log('📋 Get IAs - Query params:', { academicYearId, semester, facultyId });
        
        // Get faculty's class
        const [mentorAssignments] = await req.dbPool.execute(
            'SELECT class_id FROM mentor_assignments WHERE faculty_id = ? AND status = ?',
            [facultyId, 'active']
        );
        
        if (mentorAssignments.length === 0) {
            return res.json([]);
        }
        
        const classId = mentorAssignments[0].class_id;
        
        const [ias] = await req.dbPool.execute(
            `SELECT ia.*, s.subject_name, s.subject_code 
             FROM internal_assessments ia
             JOIN subjects s ON ia.subject_id = s.subject_id
             WHERE ia.academic_year_id = ? AND ia.semester = ? AND ia.class_id = ?
             ORDER BY ia.ia_number, s.subject_name`,
            [academicYearId, semester, classId]
        );
        
        console.log('📋 Get IAs - Query result:', ias);
        res.json(ias);
    } catch (error) {
        console.error('❌ Internal Assessments Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading internal assessments'
        });
    }
});

// Get student marks for specific IA and subject
router.get('/faculty/student-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { iaNumber, subjectId, academicYearId, semester } = req.query;
        const facultyId = req.session.user.id;
        
        // Get faculty's class
        const [mentorAssignments] = await req.dbPool.execute(
            'SELECT class_id FROM mentor_assignments WHERE faculty_id = ? AND status = ?',
            [facultyId, 'active']
        );
        
        if (mentorAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No class assigned to this faculty'
            });
        }
        
        const classId = mentorAssignments[0].class_id;
        
        // Get subject name
        const [subject] = await req.dbPool.execute(
            'SELECT subject_name FROM subjects WHERE subject_id = ?',
            [subjectId]
        );
        
        // Get internal assessment ID
        const [ia] = await req.dbPool.execute(
            `SELECT id FROM internal_assessments 
             WHERE ia_number = ? AND subject_id = ? AND academic_year_id = ? 
             AND semester = ? AND class_id = ?`,
            [iaNumber, subjectId, academicYearId, semester, classId]
        );
        
        if (ia.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Internal Assessment not found'
            });
        }
        
        // Get students and their marks
        const [students] = await req.dbPool.execute(
            `SELECT 
                s.id as student_id,
                s.first_name,
                s.last_name,
                s.register_number,
                sm.marks_obtained,
                sm.attendance,
                sm.remarks,
                ia.id as internal_assessment_id
             FROM students s
             LEFT JOIN student_marks sm ON s.id = sm.student_id AND sm.internal_assessment_id = ?
             JOIN internal_assessments ia ON ia.id = ?
             WHERE s.class_id = ? AND s.status = 'active'
             ORDER BY s.first_name, s.last_name`,
            [ia[0].id, ia[0].id, classId]
        );
        
        res.json({
            success: true,
            students,
            subjectName: subject[0].subject_name
        });
        
    } catch (error) {
        console.error('❌ Student Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading student marks'
        });
    }
});

// Save student marks
router.post('/faculty/save-student-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { marksData } = req.body;
        
        // Update or insert marks for each student
        for (const markEntry of marksData) {
            await req.dbPool.execute(
                `INSERT INTO student_marks 
                 (student_id, internal_assessment_id, marks_obtained, attendance, remarks)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 marks_obtained = VALUES(marks_obtained),
                 attendance = VALUES(attendance),
                 remarks = VALUES(remarks),
                 updated_at = NOW()`,
                [
                    markEntry.studentId,
                    markEntry.internalAssessmentId,
                    markEntry.marksObtained,
                    markEntry.attendanceStatus,
                    markEntry.remarks
                ]
            );
        }
        
        res.json({
            success: true,
            message: 'All marks saved successfully'
        });
        
    } catch (error) {
        console.error('❌ Save Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving marks'
        });
    }
});

// Upload marks from Excel/CSV file
router.post('/faculty/upload-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const XLSX = require('xlsx');
        
        if (!req.files || !req.files.marksFile) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const file = req.files.marksFile;
        const facultyId = req.session.user.id;
        
        console.log(`📁 File uploaded: ${file.name}, size: ${file.size}, mimetype: ${file.mimetype}`);
        
        // Get faculty's class
        const [mentorAssignments] = await req.dbPool.execute(
            'SELECT class_id FROM mentor_assignments WHERE faculty_id = ? AND status = ?',
            [facultyId, 'active']
        );
        
        if (mentorAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No class assigned to this faculty'
            });
        }
        
        const classId = mentorAssignments[0].class_id;
        
        let jsonData = [];
        
        // Check file type and parse accordingly
        if (file.name.toLowerCase().endsWith('.csv')) {
            console.log('📄 Processing CSV file');
            // Parse CSV content
            const csvContent = file.data.toString('utf8');
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim());
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index] || '';
                });
                jsonData.push(rowData);
            }
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            console.log('📊 Processing Excel file');
            // Parse Excel file
            const workbook = XLSX.read(file.data, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with header in first row
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Convert array format to object format
            if (jsonData.length > 0) {
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);
                jsonData = dataRows.map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index] || '';
                    });
                    return rowData;
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Unsupported file format. Please upload CSV or Excel files only.'
            });
        }
        
        const results = {
            totalRecords: jsonData.length,
            successCount: 0,
            errorCount: 0,
            processedData: []
        };
        
        console.log(`📋 Total records to process: ${jsonData.length}`);
        
        for (let i = 0; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            let record = null;
            
            try {
                record = {
                    academicYear: rowData['Academic Year'] || rowData['academic_year'] || '',
                    semester: parseInt(rowData['Semester'] || rowData['semester']) || 1,
                    ia: parseInt(rowData['IA'] || rowData['ia']) || 1,
                    subject: rowData['Subject'] || rowData['subject'] || '',
                    subjectCode: rowData['Subject Code'] || rowData['subject_code'] || '',
                    studentId: rowData['Student ID'] || rowData['student_id'] || '',
                    studentName: rowData['Student Name'] || rowData['student_name'] || '',
                    marks: parseFloat(rowData['Marks'] || rowData['marks']) || 0
                };
                
                console.log(`📋 Processing record ${i + 1}:`, record);
                console.log(`📋 Faculty ID: ${facultyId}, Class ID: ${classId}`);
                
                // Validate required fields
                if (!record.studentId || !record.subjectCode || isNaN(record.marks)) {
                    record.status = 'Error: Missing required fields';
                    results.errorCount++;
                    results.processedData.push(record);
                    continue;
                }
                
                // Find the student in database
                console.log(`🔍 Looking for student: ${record.studentId} in class ${classId}`);
                const [student] = await req.dbPool.execute(
                    'SELECT id FROM students WHERE register_number = ? AND class_id = ?',
                    [record.studentId, classId]
                );
                
                if (student.length === 0) {
                    record.status = 'Error: Student not found';
                    results.errorCount++;
                    results.processedData.push(record);
                    continue;
                }
                console.log(`✅ Student found: ${student[0].id}`);
                
                // Find the subject
                console.log(`🔍 Looking for subject: ${record.subjectCode}, semester: ${record.semester}`);
                const [subject] = await req.dbPool.execute(
                    'SELECT subject_id FROM subjects WHERE subject_code = ? AND semester = ?',
                    [record.subjectCode, record.semester]
                );
                
                if (subject.length === 0) {
                    record.status = 'Error: Subject not found';
                    results.errorCount++;
                    results.processedData.push(record);
                    continue;
                }
                console.log(`✅ Subject found: ${subject[0].subject_id}`);
                
                // Find or create internal assessment
                console.log(`🔍 Looking for IA: ia=${record.ia}, subject_id=${subject[0].subject_id}, semester=${record.semester}, class_id=${classId}, faculty_id=${facultyId}`);
                let [ia] = await req.dbPool.execute(
                    `SELECT id FROM internal_assessments 
                     WHERE ia_number = ? AND subject_id = ? AND semester = ? AND class_id = ? AND faculty_id = ?`,
                    [record.ia, subject[0].subject_id, record.semester, classId, facultyId]
                );
                
                let iaId;
                if (ia.length === 0) {
                    console.log(`➕ Creating new IA`);
                    // Create new internal assessment
                    const [iaResult] = await req.dbPool.execute(
                        `INSERT INTO internal_assessments 
                         (ia_number, subject_id, academic_year_id, semester, class_id, faculty_id) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [record.ia, subject[0].subject_id, 1, record.semester, classId, facultyId] // Using academic_year_id = 1 for now
                    );
                    iaId = iaResult.insertId;
                    console.log(`✅ IA created with ID: ${iaId}`);
                } else {
                    iaId = ia[0].id;
                    console.log(`✅ IA found: ${iaId}`);
                }
                
                // Insert or update student marks
                console.log(`📝 Saving marks: student_id=${student[0].id}, ia_id=${iaId}, marks=${record.marks}`);
                await req.dbPool.execute(
                    `INSERT INTO student_marks (student_id, internal_assessment_id, marks_obtained, attendance)
                     VALUES (?, ?, ?, 'Present') 
                     ON DUPLICATE KEY UPDATE marks_obtained = ?, attendance = 'Present'`,
                    [student[0].id, iaId, record.marks, record.marks]
                );
                
                record.status = 'Success';
                results.successCount++;
                results.processedData.push(record);
                console.log(`✅ Record processed successfully`);
                
            } catch (error) {
                console.error('Error processing record:', error);
                results.errorCount++;
                
                // Ensure record exists for error handling
                if (!record) {
                    const rowData = jsonData[i];
                    record = {
                        academicYear: rowData['Academic Year'] || rowData['academic_year'] || '',
                        semester: rowData['Semester'] || rowData['semester'] || '',
                        ia: rowData['IA'] || rowData['ia'] || '',
                        subject: rowData['Subject'] || rowData['subject'] || '',
                        subjectCode: rowData['Subject Code'] || rowData['subject_code'] || '',
                        studentId: rowData['Student ID'] || rowData['student_id'] || '',
                        studentName: rowData['Student Name'] || rowData['student_name'] || '',
                        marks: rowData['Marks'] || rowData['marks'] || ''
                    };
                }
                
                record.status = 'Error: Processing failed - ' + error.message;
                results.processedData.push(record);
            }
        }
        
        res.json({
            success: true,
            message: 'File processed successfully',
            results
        });
        
    } catch (error) {
        console.error('❌ Upload Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file'
        });
    }
});

module.exports = router;
