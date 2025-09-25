const express = require('express');
const router = express.Router();

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
            'SELECT id, name FROM departments WHERE id = ?',
            [department]
        );

        if (departmentResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        const departmentName = departmentResult[0].name;
        const departmentId = departmentResult[0].id;
        const facultyPassword = password || faculty_code;

        // Insert faculty with all form data
        await req.dbPool.execute(
            `INSERT INTO faculty (
                faculty_code, first_name, last_name, email, phone,
                date_of_birth, gender, department, designation, qualification,
                experience_years, date_of_joining, password, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
                faculty_code, first_name, last_name, email, phone,
                date_of_birth, gender, departmentName, designation, qualification,
                experience_years || 0, date_of_joining, facultyPassword
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
                id, faculty_code, first_name, last_name, email, phone,
                date_of_birth, gender, department, designation, qualification,
                experience_years, date_of_joining, status, created_at
            FROM faculty 
            ORDER BY created_at DESC
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
        
        // Get department name first
        const [departmentResult] = await req.dbPool.execute(
            'SELECT name FROM departments WHERE id = ?',
            [departmentId]
        );

        if (departmentResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const departmentName = departmentResult[0].name;

        const [faculty] = await req.dbPool.execute(
            'SELECT * FROM faculty WHERE department = ? AND status = "active" ORDER BY designation, first_name',
            [departmentName]
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
            `SELECT c.*, ay.year_range, d.name as department_name 
             FROM classes c 
             JOIN academic_years ay ON c.academic_year_id = ay.id 
             JOIN departments d ON ay.department_id = d.id 
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
                ma.id, ma.assigned_date, ma.status, ma.notes,
                c.class_name, c.section, c.capacity, c.current_strength,
                ay.year_range,
                d.name as department_name,
                f.first_name, f.last_name, f.faculty_code, f.email, f.phone, f.designation,
                (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON ay.department_id = d.id
            JOIN faculty f ON ma.faculty_id = f.id
            WHERE ma.status = 'active'
            ORDER BY d.name, ay.year_range, c.class_name, c.section
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
                f.date_of_birth,
                f.gender,
                f.department,
                f.designation,
                f.qualification,
                f.experience_years,
                f.date_of_joining,
                f.status,
                f.created_at
            FROM faculty f
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

module.exports = router;
