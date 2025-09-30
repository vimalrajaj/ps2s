const express = require('express');
const router = express.Router();

// Get subjects by department, academic year, and semester
router.get('/subjects/:departmentId/:academicYear/:semester', async (req, res) => {
    const { departmentId, academicYear, semester } = req.params;
    try {
        const { data: subjectsRaw, error } = await req.supabase
            .from('subjects')
            .select('id, subject_code, subject_name, academic_year, credits, subject_type, is_elective, faculty_id, department_id')
            .eq('department_id', departmentId)
            .eq('academic_year', academicYear)
            .eq('semester', semester)
            .order('subject_code');
        if (error) throw error;

        const facultyIds = [...new Set((subjectsRaw || []).map(s => s.faculty_id).filter(Boolean))];
        const deptIds = [...new Set((subjectsRaw || []).map(s => s.department_id).filter(Boolean))];

        const { data: faculties } = await req.supabase
            .from('faculty')
            .select('id, first_name, last_name, faculty_code, email, phone')
            .in('id', facultyIds.length ? facultyIds : [0]);

        const { data: departments } = await req.supabase
            .from('departments')
            .select('id, dept_name, dept_code')
            .in('id', deptIds.length ? deptIds : [0]);

        const facultyMap = new Map((faculties || []).map(f => [f.id, f]));
        const deptMap = new Map((departments || []).map(d => [d.id, d]));

        const subjects = (subjectsRaw || []).map(s => {
            const fac = facultyMap.get(s.faculty_id);
            const dept = deptMap.get(s.department_id);
            return {
                id: s.id,
                code: s.subject_code,
                name: s.subject_name,
                credits: s.credits,
                type: s.subject_type,
                isElective: s.is_elective,
                academicYear: s.academic_year,
                faculty: fac ? {
                    name: fac.first_name && fac.last_name ? `${fac.first_name} ${fac.last_name}` : 'Not Assigned',
                    code: fac.faculty_code || 'N/A',
                        email: fac.email || 'N/A',
                    phone: fac.phone || 'N/A'
                } : {
                    name: 'Not Assigned', code: 'N/A', email: 'N/A', phone: 'N/A'
                },
                department: dept ? { name: dept.dept_name, code: dept.dept_code } : { name: null, code: null }
            };
        });

        res.json({ success: true, subjects });
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ success: false, message: 'Error fetching subjects', error: err.message });
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
        const { data: existing, error: existingError } = await req.supabase
            .from('subjects')
            .select('id')
            .or(`subject_code.eq.${subjectCode},subject_name.eq.${subjectName}`);
        if (existingError) return res.status(500).json({ success: false, message: 'Internal server error' });
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Subject with this code or name already exists' });
        }

        const { data: inserted, error: insertError } = await req.supabase
            .from('subjects')
            .insert([{ subject_code: subjectCode, subject_name: subjectName, department_id: departmentId, faculty_id: facultyId || null, semester, academic_year: academicYear, credits: credits || 3, subject_type: subjectType || 'Theory', is_elective: isElective || false }])
            .select('id')
            .single();

        if (insertError) return res.status(500).json({ success: false, message: 'Failed to create subject' });

        res.json({ success: true, message: 'Subject added successfully', subjectId: inserted.id });
    } catch (err) {
        console.error('Error adding subject:', err);
        res.status(500).json({ success: false, message: 'Error adding subject', error: err.message });
    }
});

// Academic years that have subjects for a department
router.get('/subjects/academic-years/:departmentId', async (req, res) => {
    const { departmentId } = req.params;
    try {
        const { data, error } = await req.supabase
            .from('subjects')
            .select('academic_year')
            .eq('department_id', departmentId)
            .order('academic_year', { ascending: false });
        if (error) throw error;
        const years = [];
        const seen = new Set();
        (data || []).forEach(r => { if (r.academic_year && !seen.has(r.academic_year)) { seen.add(r.academic_year); years.push(r.academic_year); } });
        res.json({ success: true, academicYears: years });
    } catch (err) {
        console.error('Error fetching academic years:', err);
        res.status(500).json({ success: false, message: 'Error fetching academic years', error: err.message });
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
        const { error: updateError } = await req.supabase
            .from('subjects')
            .update({ subject_code: subjectCode, subject_name: subjectName, department_id: departmentId, faculty_id: facultyId || null, semester, academic_year: academicYear, credits: credits || 3, subject_type: subjectType || 'Theory', is_elective: isElective || false })
            .eq('id', subjectId);
        if (updateError) return res.status(500).json({ success: false, message: 'Failed to update subject' });
        res.json({ success: true, message: 'Subject updated successfully' });
    } catch (err) {
        console.error('Error updating subject:', err);
        res.status(500).json({ success: false, message: 'Error updating subject', error: err.message });
    }
});

// Delete subject
router.delete('/subjects/:subjectId', async (req, res) => {
    const { subjectId } = req.params;
    try {
        const { error: deleteError } = await req.supabase
            .from('subjects')
            .delete()
            .eq('id', subjectId);
        if (deleteError) return res.status(500).json({ success: false, message: 'Failed to delete subject' });
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ success: false, message: 'Error deleting subject', error: err.message });
    }
});

module.exports = router;