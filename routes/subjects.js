const express = require('express');
const router = express.Router();

// Get subjects by department, academic year, and semester
router.get('/subjects/:departmentId/:academicYear/:semester', async (req, res) => {
    const { departmentId, academicYear, semester } = req.params;
    
    try {
        const connection = await req.dbPool.getConnection();
        
        const query = `
            SELECT 
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.academic_year,
                s.credits,
                s.subject_type,
                s.is_elective,
                f.first_name,
                f.last_name,
                f.faculty_code,
                f.email as faculty_email,
                f.phone as faculty_phone,
                d.name as department_name,
                d.code as department_code
            FROM subjects s
            LEFT JOIN faculty f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.department_id = ? AND s.academic_year = ? AND s.semester = ?
            ORDER BY s.subject_code ASC
        `;
        
        const [subjects] = await connection.execute(query, [departmentId, academicYear, semester]);
        
        connection.release();
        
        console.log(`📚 Found ${subjects.length} subjects for dept ${departmentId}, year ${academicYear}, semester ${semester}`);
        
        res.json({
            success: true,
            subjects: subjects.map(subject => ({
                id: subject.subject_id,
                code: subject.subject_code,
                name: subject.subject_name,
                credits: subject.credits,
                type: subject.subject_type,
                isElective: subject.is_elective,
                academicYear: subject.academic_year,
                faculty: {
                    name: subject.first_name && subject.last_name ? `${subject.first_name} ${subject.last_name}` : 'Not Assigned',
                    code: subject.faculty_code || 'N/A',
                    email: subject.faculty_email || 'N/A',
                    phone: subject.faculty_phone || 'N/A'
                },
                department: {
                    name: subject.department_name,
                    code: subject.department_code
                }
            }))
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects',
            error: error.message
        });
    }
});

// Add new subject
router.post('/subjects', async (req, res) => {
    const {
        subjectCode,
        subjectName,
        departmentId,
        facultyId,
        semester,
        academicYear,
        credits,
        subjectType,
        isElective
    } = req.body;
    
    try {
        const connection = await req.dbPool.getConnection();
        
        // Check if subject code already exists for this semester and academic year
        const checkQuery = `
            SELECT subject_id FROM subjects 
            WHERE subject_code = ? AND semester = ? AND academic_year = ?
        `;
        const [existing] = await connection.execute(checkQuery, [subjectCode, semester, academicYear]);
        
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Subject code already exists for this semester and academic year'
            });
        }
        
        const insertQuery = `
            INSERT INTO subjects (
                subject_code, subject_name, department_id, faculty_id, 
                semester, academic_year, credits, subject_type, is_elective
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.execute(insertQuery, [
            subjectCode, subjectName, departmentId, facultyId || null,
            semester, academicYear, credits || 3, subjectType || 'Theory', 
            isElective || false
        ]);
        
        connection.release();
        
        console.log(`✅ Subject added successfully: ${subjectCode} - ${subjectName}`);
        
        res.json({
            success: true,
            message: 'Subject added successfully',
            subjectId: result.insertId
        });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding subject',
            error: error.message
        });
    }
});

// Get all academic years that have subjects
router.get('/subjects/academic-years/:departmentId', async (req, res) => {
    const { departmentId } = req.params;
    
    try {
        const connection = await req.dbPool.getConnection();
        
        const query = `
            SELECT DISTINCT academic_year
            FROM subjects
            WHERE department_id = ?
            ORDER BY academic_year DESC
        `;
        
        const [years] = await connection.execute(query, [departmentId]);
        
        connection.release();
        
        console.log(`📅 Found ${years.length} academic years with subjects for department ${departmentId}`);
        
        res.json({
            success: true,
            academicYears: years.map(row => row.academic_year)
        });
    } catch (error) {
        console.error('Error fetching academic years:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic years',
            error: error.message
        });
    }
});

// Update subject
router.put('/subjects/:subjectId', async (req, res) => {
    const { subjectId } = req.params;
    const {
        subjectCode,
        subjectName,
        departmentId,
        facultyId,
        semester,
        academicYear,
        credits,
        subjectType,
        isElective
    } = req.body;
    
    try {
        const connection = await req.dbPool.getConnection();
        
        const updateQuery = `
            UPDATE subjects SET
                subject_code = ?, subject_name = ?, department_id = ?, faculty_id = ?,
                semester = ?, academic_year = ?, credits = ?, subject_type = ?, 
                is_elective = ?, updated_at = CURRENT_TIMESTAMP
            WHERE subject_id = ?
        `;
        
        const [result] = await connection.execute(updateQuery, [
            subjectCode, subjectName, departmentId, facultyId || null,
            semester, academicYear, credits || 3, subjectType || 'Theory',
            isElective || false, subjectId
        ]);
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        console.log(`✅ Subject updated successfully: ${subjectCode} - ${subjectName}`);
        
        res.json({
            success: true,
            message: 'Subject updated successfully'
        });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subject',
            error: error.message
        });
    }
});

// Delete subject
router.delete('/subjects/:subjectId', async (req, res) => {
    const { subjectId } = req.params;
    
    try {
        const connection = await req.dbPool.getConnection();
        
        const deleteQuery = 'DELETE FROM subjects WHERE subject_id = ?';
        const [result] = await connection.execute(deleteQuery, [subjectId]);
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        console.log(`🗑️ Subject deleted successfully with ID: ${subjectId}`);
        
        res.json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting subject',
            error: error.message
        });
    }
});

module.exports = router;