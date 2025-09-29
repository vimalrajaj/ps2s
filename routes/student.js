const express = require('express');
const router = express.Router();

// Create student route
router.post('/create-student', async (req, res) => {
    try {
        const { 
            register_number, 
            first_name, 
            last_name, 
            email, 
            phone,
            date_of_birth,
            gender,
            department,
            academic_year,
            class_id,
            current_semester,
            current_year,
            parent_name,
            parent_phone,
            address,
            password 
        } = req.body;

        // Validate required fields
        if (!register_number || !first_name || !last_name || !email || !department || !class_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields missing: Register Number, Name, Email, Department, and Class are required' 
            });
        }

        // Check if student already exists
        const [existingStudent] = await req.dbPool.execute(
            'SELECT * FROM students WHERE register_number = ? OR email = ?',
            [register_number, email]
        );

        if (existingStudent.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student with this register number or email already exists'
            });
        }

        // Get department name and class details
        const [departmentResult] = await req.dbPool.execute(
            'SELECT dept_name, dept_code FROM departments WHERE id = ?',
            [department]
        );

        const [classResult] = await req.dbPool.execute(
            `SELECT c.*, ay.year_range 
             FROM classes c 
             JOIN academic_years ay ON c.academic_year_id = ay.id 
             WHERE c.id = ?`,
            [class_id]
        );

        if (departmentResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        if (classResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class selected'
            });
        }

        const departmentName = departmentResult[0].dept_name;
        const departmentCode = departmentResult[0].dept_code;
        const classInfo = classResult[0];
        
        // Check if class has available capacity (default capacity: 60 students)
        const maxCapacity = classInfo.capacity || 60;
        if (classInfo.total_students >= maxCapacity) {
            return res.status(400).json({
                success: false,
                message: 'Selected class is full. Please choose another class.'
            });
        }

        const studentPassword = password || register_number;

        // Get a connection from the pool for transaction
        const connection = await req.dbPool.getConnection();

        try {
            // Start transaction
            await connection.beginTransaction();

            // Insert student with all form data including class information
            await connection.execute(
                `INSERT INTO students (
                    register_number, first_name, last_name, email, phone, 
                    date_of_birth, gender, department, class_id, current_semester, current_year,
                    parent_name, parent_phone, address, password, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    register_number, first_name, last_name, email, phone,
                    date_of_birth, gender, departmentCode, class_id, current_semester || 1, current_year || 1,
                    parent_name, parent_phone, address, studentPassword
                ]
            );

            // Update class total students count
            await connection.execute(
                'UPDATE classes SET total_students = total_students + 1 WHERE id = ?',
                [class_id]
            );

            // Commit transaction
            await connection.commit();
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection back to pool
            connection.release();
        }

        res.status(201).json({
            success: true,
            message: 'Student account created successfully',
            student: {
                register_number,
                name: `${first_name} ${last_name}`,
                email,
                department: departmentName,
                class: `${classInfo.class_name} - ${classInfo.section}`,
                academic_year: classInfo.year_range
            }
        });

    } catch (error) {
        console.error('Error creating student:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: 'Student with this register number or email already exists' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const [students] = await req.dbPool.execute(`
            SELECT 
                s.*,
                d.dept_name,
                d.dept_code
            FROM students s
            LEFT JOIN departments d ON s.department = d.dept_code
            ORDER BY s.created_at DESC
        `);

        console.log('📚 Total students found:', students.length);

        res.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


// Get students by class ID
router.get('/class/:classId/students', async (req, res) => {
    try {
        const { classId } = req.params;
        console.log('🔍 Fetching students for class ID:', classId);

        const [students] = await req.dbPool.execute(`
            SELECT 
                s.*,
                c.class_name,
                c.section,
                c.class_teacher,
                ay.year_range,
                ay.start_year,
                ay.end_year,
                d.dept_name as department_name,
                d.dept_code as department_code,
                COALESCE(s.current_semester, 1) as current_semester,
                COALESCE(s.current_year, 1) as current_year,
                COALESCE(s.parent_name, 'N/A') as parent_name,
                COALESCE(s.parent_phone, 'N/A') as parent_phone,
                COALESCE(s.address, 'N/A') as address,
                COALESCE(s.status, 'active') as status
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            LEFT JOIN departments d ON c.department_id = d.id
            WHERE s.class_id = ?
            ORDER BY s.first_name, s.last_name
        `, [classId]);

        console.log('📊 Found', students.length, 'students for class', classId);
        console.log('👥 Students:', students.map(s => `${s.first_name} ${s.last_name} (${s.register_number})`));

        // Get mentor information from mentor_assignments table
        let mentor = null;
        const [mentorResult] = await req.dbPool.execute(`
            SELECT 
                f.id as faculty_id,
                CONCAT(f.first_name, ' ', f.last_name) as name,
                f.email,
                f.phone,
                f.designation,
                f.faculty_code,
                ma.assignment_date,
                ma.status
            FROM mentor_assignments ma
            JOIN faculty f ON ma.faculty_id = f.id
            WHERE ma.class_id = ? AND ma.status = 'active'
            LIMIT 1
        `, [classId]);
        
        if (mentorResult.length > 0) {
            mentor = mentorResult[0];
            console.log('👨‍🏫 Found mentor:', mentor.name, 'for class', classId);
        } else {
            console.log('❌ No mentor assigned for class', classId);
        }

        res.json({
            success: true,
            students: students.map(s => ({
                name: `${s.first_name} ${s.last_name}`,
                register_number: s.register_number,
                email: s.email,
                phone: s.phone
            })),
            mentor: mentor,
            count: students.length
        });

    } catch (error) {
        console.error('Error fetching students by class:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get individual student details by register number
router.get('/student/:registerNumber', async (req, res) => {
    try {
        const { registerNumber } = req.params;

        const [students] = await req.dbPool.execute(`
            SELECT 
                s.*,
                c.class_name,
                c.section,
                d.dept_name as department_name,
                d.dept_code,
                ay.year_range
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            WHERE s.register_number = ?
        `, [registerNumber]);

        if (students.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        res.json(students[0]);

    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get all students with detailed information for dashboard
router.get('/students/all-details', async (req, res) => {
    try {
        const [students] = await req.dbPool.execute(`
            SELECT 
                s.id,
                s.register_number,
                s.first_name,
                s.last_name,
                s.email,
                s.phone,
                s.date_of_birth,
                s.gender,
                s.department,
                d.dept_name,
                d.dept_code,
                s.current_semester,
                s.current_year,
                s.parent_name,
                s.parent_phone,
                s.address,
                s.status,
                s.created_at,
                s.class_id
            FROM students s
            LEFT JOIN departments d ON s.department = d.dept_code
            WHERE s.status = 'active'
            ORDER BY s.register_number
        `);

        console.log('📚 Fetched', students.length, 'students for detailed view');

        res.json({
            success: true,
            students: students,
            count: students.length
        });

    } catch (error) {
        console.error('Error fetching all students details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get individual student profile by ID
router.get('/api/students/profile/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log('👤 Fetching profile for student ID:', studentId);
        
        // Get detailed student information
        const [students] = await req.dbPool.execute(`
            SELECT 
                s.*,
                c.class_name,
                c.department as class_department,
                c.semester as class_semester,
                c.academic_year
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.id = ?
            LIMIT 1
        `, [studentId]);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];
        console.log(`✅ Found student profile: ${student.first_name} ${student.last_name}`);

        res.json({
            success: true,
            student: student
        });

    } catch (error) {
        console.error('❌ Error fetching student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student profile',
            error: error.message
        });
    }
});

module.exports = router;
