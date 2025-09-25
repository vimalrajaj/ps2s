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
            'SELECT name FROM departments WHERE name = ? OR code = ?',
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
            'INSERT INTO departments (name, code, description, head_of_department) VALUES (?, ?, ?, ?)',
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
            'SELECT * FROM departments ORDER BY name'
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
            'UPDATE departments SET name = ?, code = ?, description = ?, head_of_department = ? WHERE id = ?',
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

        // Delete department
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

        // Get academic years for this department
        const [academicYears] = await req.dbPool.execute(
            'SELECT * FROM academic_years WHERE department_id = ? ORDER BY start_year DESC',
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
            'INSERT INTO academic_years (department_id, year_range, start_year, end_year) VALUES (?, ?, ?, ?)',
            [id, year_range, start_year, end_year]
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

        const [classes] = await req.dbPool.execute(
            'SELECT * FROM classes WHERE academic_year_id = ? ORDER BY class_name, section',
            [id]
        );

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
        const { class_name, section, capacity, class_teacher } = req.body;

        if (!class_name || !section) {
            return res.status(400).json({
                success: false,
                message: 'Class name and section are required'
            });
        }

        await req.dbPool.execute(
            'INSERT INTO classes (academic_year_id, class_name, section, capacity, class_teacher) VALUES (?, ?, ?, ?, ?)',
            [id, class_name, section, capacity || 60, class_teacher || null]
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

        // Delete all classes in this academic year first (due to foreign key constraints)
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
                d.code as dept_code,
                d.name as dept_name,
                d.head_of_department as dept_head,
                COUNT(DISTINCT f.id) as faculty_count,
                COUNT(DISTINCT s.id) as student_count
            FROM departments d
            LEFT JOIN faculty f ON d.name = f.department AND f.status = 'active'
            LEFT JOIN students s ON d.name = s.department AND s.status = 'active'
            GROUP BY d.id, d.code, d.name, d.head_of_department
            ORDER BY d.code
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

module.exports = router;