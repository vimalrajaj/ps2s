const express = require('express');
const router = express.Router();

// Create new department
router.post('/departments', async (req, res) => {
    try {
        const { name, code, description, head_of_department } = req.body;

        if (!name || !code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department name and code are required' 
            });
        }

        // Check if department already exists
        const [existing] = await req.dbPool.execute(
            'SELECT dept_name FROM departments WHERE dept_name = ? OR dept_code = ?',
            [name, code]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department with this name or code already exists' 
            });
        }

        // Insert new department
        await req.dbPool.execute(
            'INSERT INTO departments (dept_name, dept_code, description, head_of_department) VALUES (?, ?, ?, ?)',
            [name, code, description || null, head_of_department || null]
        );

        res.status(201).json({
            success: true,
            message: 'Department created successfully'
        });

    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get all departments
router.get('/departments', async (req, res) => {
    try {
        const [departments] = await req.dbPool.execute(
            'SELECT * FROM departments ORDER BY dept_name'
        );

        res.json({
            success: true,
            departments: departments
        });

    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update department
router.put('/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, head_of_department } = req.body;

        if (!name || !code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department name and code are required' 
            });
        }

        // Check if department exists
        const [existing] = await req.dbPool.execute(
            'SELECT id FROM departments WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Department not found' 
            });
        }

        // Update department
        await req.dbPool.execute(
            'UPDATE departments SET dept_name = ?, dept_code = ?, description = ?, head_of_department = ? WHERE id = ?',
            [name, code, description || null, head_of_department || null, id]
        );

        res.json({
            success: true,
            message: 'Department updated successfully'
        });

    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department exists
        const [existing] = await req.dbPool.execute(
            'SELECT id FROM departments WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Department not found' 
            });
        }

        // Get department code for cleanup
        const [deptInfo] = await req.dbPool.execute(
            'SELECT dept_code FROM departments WHERE id = ?',
            [id]
        );

        if (deptInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const deptCode = deptInfo[0].dept_code;

        // CASCADE DELETION: Delete all associated data
        
        // 1. Delete mentor assignments for classes in this department
        await req.dbPool.execute(
            'DELETE ma FROM mentor_assignments ma JOIN classes c ON ma.class_id = c.id WHERE c.department_id = ?',
            [id]
        );

        // 2. Delete subjects in this department
        await req.dbPool.execute(
            'DELETE FROM subjects WHERE department_id = ?',
            [id]
        );

        // 3. Update students to remove department assignment
        await req.dbPool.execute(
            'UPDATE students SET department = NULL, class_id = NULL WHERE department = ?',
            [deptCode]
        );

        // 4. Update faculty to remove department assignment
        await req.dbPool.execute(
            'UPDATE faculty SET department = NULL WHERE department = ?',
            [deptCode]
        );

        // 5. Delete classes in this department
        await req.dbPool.execute(
            'DELETE FROM classes WHERE department_id = ?',
            [id]
        );

        // 6. Finally, delete the department
        await req.dbPool.execute(
            'DELETE FROM departments WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get department details with academic years
router.get('/departments/:id/details', async (req, res) => {
    try {
        const { id } = req.params;

        // Get department details
        const [department] = await req.dbPool.execute(
            'SELECT * FROM departments WHERE id = ?',
            [id]
        );

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Get all academic years (since they're independent of departments)
        // Plus academic years that have classes in this department
        const [academicYears] = await req.dbPool.execute(
            `SELECT DISTINCT ay.*, 
                    COUNT(c.id) as class_count
             FROM academic_years ay 
             LEFT JOIN classes c ON ay.id = c.academic_year_id AND c.department_id = ?
             GROUP BY ay.id 
             ORDER BY ay.start_year DESC`,
            [id]
        );

        res.json({
            success: true,
            department: department[0],
            academicYears
        });

    } catch (error) {
        console.error('Error fetching department details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create academic year for a department
router.post('/departments/:id/academic-years', async (req, res) => {
    try {
        const { id } = req.params;
        const { start_year, end_year } = req.body;

        if (!start_year || !end_year) {
            return res.status(400).json({
                success: false,
                message: 'Start year and end year are required'
            });
        }

        const year_range = `${start_year} - ${end_year}`;

        await req.dbPool.execute(
            'INSERT INTO academic_years (year_range, start_year, end_year) VALUES (?, ?, ?)',
            [year_range, start_year, end_year]
        );

        res.status(201).json({
            success: true,
            message: 'Academic year created successfully'
        });

    } catch (error) {
        console.error('Error creating academic year:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                message: 'Academic year already exists for this department'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
});

// Get classes for an academic year
router.get('/academic-years/:id/classes', async (req, res) => {
    try {
        const { id } = req.params;

        const [classes] = await req.dbPool.execute(`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count,
                COALESCE(f.first_name, '') as mentor_first_name,
                COALESCE(f.last_name, '') as mentor_last_name,
                COALESCE(CONCAT(f.first_name, ' ', f.last_name), 'Not assigned') as mentor_name
            FROM classes c
            LEFT JOIN mentor_assignments ma ON c.id = ma.class_id AND ma.status = 'active'
            LEFT JOIN faculty f ON ma.faculty_id = f.id
            WHERE c.academic_year_id = ? 
            ORDER BY c.class_name, c.section
        `, [id]);

        console.log('🏫 Classes found for academic year', id, ':', classes.length);
        if (classes.length > 0) {
            console.log('📋 Classes:', classes.map(c => `${c.class_name}-${c.section} (ID: ${c.id})`));
        }

        res.json({
            success: true,
            classes
        });

    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create class for an academic year
router.post('/academic-years/:id/classes', async (req, res) => {
    try {
        const { id } = req.params;
        const { class_name, section, room_number, class_teacher, department_id } = req.body;

        if (!class_name || !section || !department_id) {
            return res.status(400).json({
                success: false,
                message: 'Class name, section, and department are required'
            });
        }

        await req.dbPool.execute(
            'INSERT INTO classes (academic_year_id, department_id, class_name, section, room_number, class_teacher) VALUES (?, ?, ?, ?, ?, ?)',
            [id, department_id, class_name, section, room_number || null, class_teacher || null]
        );

        res.status(201).json({
            success: true,
            message: 'Class created successfully'
        });

    } catch (error) {
        console.error('Error creating class:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                message: 'Class with this name and section already exists'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
});

// Delete class
router.delete('/classes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First, delete all mentor assignments for this class (cascade deletion)
        await req.dbPool.execute(
            'DELETE FROM mentor_assignments WHERE class_id = ?',
            [id]
        );

        // Check if class has students
        const [students] = await req.dbPool.execute(
            'SELECT COUNT(*) as student_count FROM students WHERE class_id = ?',
            [id]
        );

        if (students[0].student_count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${students[0].student_count} students. Please reassign students first.`
            });
        }

        const [result] = await req.dbPool.execute(
            'DELETE FROM classes WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete academic year
router.delete('/academic-years/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if academic year exists
        const [academicYear] = await req.dbPool.execute(
            'SELECT * FROM academic_years WHERE id = ?',
            [id]
        );

        if (academicYear.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Academic year not found'
            });
        }

        // Check if academic year has classes with students (we'll handle mentor assignments automatically)
        const [classes] = await req.dbPool.execute(
            `SELECT c.id, c.class_name, c.section,
                    COUNT(DISTINCT s.id) as student_count
             FROM classes c
             LEFT JOIN students s ON c.id = s.class_id
             WHERE c.academic_year_id = ?
             GROUP BY c.id, c.class_name, c.section`,
            [id]
        );

        // Check if any class has student dependencies
        for (const cls of classes) {
            if (cls.student_count > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete academic year. Class "${cls.class_name}-${cls.section}" has ${cls.student_count} students. Please reassign students first.`
                });
            }
        }

        // First, delete all mentor assignments for classes in this academic year
        await req.dbPool.execute(
            'DELETE ma FROM mentor_assignments ma JOIN classes c ON ma.class_id = c.id WHERE c.academic_year_id = ?',
            [id]
        );

        // Then delete all classes for this academic year
        await req.dbPool.execute(
            'DELETE FROM classes WHERE academic_year_id = ?',
            [id]
        );

        // Delete the academic year
        const [result] = await req.dbPool.execute(
            'DELETE FROM academic_years WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Academic year not found'
            });
        }

        res.json({
            success: true,
            message: 'Academic year deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting academic year:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all departments with detailed information for dashboard
router.get('/departments/all-details', async (req, res) => {
    try {
        const [departments] = await req.dbPool.execute(`
            SELECT 
                d.id,
                d.dept_code as dept_code,
                d.dept_name as dept_name,
                d.head_of_department as dept_head,
                COUNT(DISTINCT f.id) as faculty_count,
                COUNT(DISTINCT s.id) as student_count
            FROM departments d
            LEFT JOIN faculty f ON d.dept_code = f.department AND f.status = 'active'
            LEFT JOIN students s ON d.dept_code = s.department AND s.status = 'active'
            GROUP BY d.id, d.dept_code, d.dept_name, d.head_of_department
            ORDER BY d.dept_code
        `);

        console.log('🏢 Fetched', departments.length, 'departments for detailed view');

        res.json({
            success: true,
            departments: departments,
            count: departments.length
        });

    } catch (error) {
        console.error('Error fetching all departments details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get all academic years
router.get('/academic-years', async (req, res) => {
    try {
        const [academicYears] = await req.dbPool.execute(
            'SELECT * FROM academic_years ORDER BY start_year DESC'
        );

        res.json({
            success: true,
            academicYears
        });

    } catch (error) {
        console.error('Error fetching academic years:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

module.exports = router;