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
        const { data: existing, error: existingError } = await req.supabase
            .from('departments')
            .select('id')
            .or(`dept_name.eq.${name},dept_code.eq.${code}`);
        if (existingError) {
            console.error('Dept existence check error:', existingError);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (existing && existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Department with this name or code already exists' 
            });
        }
        const { error: insertError } = await req.supabase
            .from('departments')
            .insert([{ dept_name: name, dept_code: code, description: description || null, head_of_department: head_of_department || null }]);
        if (insertError) {
            console.error('Insert department error:', insertError);
            return res.status(500).json({ success: false, message: 'Failed to create department' });
        }

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
        const { data: departments, error } = await req.supabase
            .from('departments')
            .select('*')
            .order('dept_name');
        if (error) throw error;

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
        const { data: dept, error: deptError } = await req.supabase
            .from('departments')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (deptError) {
            console.error('Dept fetch error:', deptError);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (!dept) {
            return res.status(404).json({ 
                success: false, 
                message: 'Department not found' 
            });
        }
        const { error: updateError } = await req.supabase
            .from('departments')
            .update({ dept_name: name, dept_code: code, description: description || null, head_of_department: head_of_department || null })
            .eq('id', id);
        if (updateError) {
            console.error('Dept update error:', updateError);
            return res.status(500).json({ success: false, message: 'Failed to update department' });
        }

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
        const { data: dept, error: deptError } = await req.supabase
            .from('departments')
            .select('id, dept_code')
            .eq('id', id)
            .maybeSingle();
        if (deptError) return res.status(500).json({ success: false, message: 'Internal server error' });
        if (!dept) {
            return res.status(404).json({ 
                success: false, 
                message: 'Department not found' 
            });
        }
        const deptCode = dept.dept_code;

        // CASCADE DELETION: Delete all associated data
        
        // 1. Delete mentor assignments for classes in this department
        await req.supabase.from('mentor_assignments').delete().in('class_id', (await (async ()=>{ const { data } = await req.supabase.from('classes').select('id').eq('department_id', id); return (data||[]).map(c=>c.id); })()));

        // 2. Delete subjects in this department
        await req.supabase.from('subjects').delete().eq('department_id', id);

        // 3. Update students to remove department assignment
        await req.supabase.from('students').update({ department: null, class_id: null }).eq('department', deptCode);

        // 4. Update faculty to remove department assignment
        await req.supabase.from('faculty').update({ department: null }).eq('department', deptCode);

        // 5. Delete classes in this department
        await req.supabase.from('classes').delete().eq('department_id', id);

        // 6. Finally, delete the department
        await req.supabase.from('departments').delete().eq('id', id);

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
        const { data: department, error: deptError } = await req.supabase
            .from('departments')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (deptError) return res.status(500).json({ success: false, message: 'Internal server error' });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Get all academic years (since they're independent of departments)
        // Plus academic years that have classes in this department
        const { data: academicYears, error: ayError } = await req.supabase
            .from('academic_years')
            .select('id, year_range, start_year, end_year')
            .order('start_year', { ascending: false });
        if (ayError) return res.status(500).json({ success: false, message: 'Internal server error' });

        res.json({
            success: true,
            department: department,
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

        const { error: insertError } = await req.supabase
            .from('academic_years')
            .insert([{ year_range, start_year, end_year, status: 'active' }]);
        if (insertError) {
            if (insertError.code === '23505') { // unique_violation
                return res.status(400).json({ success: false, message: 'Academic year already exists' });
            }
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

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

        const { data: classesRaw, error: clsError } = await req.supabase
            .from('classes')
            .select('id, academic_year_id, class_name, section')
            .eq('academic_year_id', id)
            .order('class_name')
            .order('section');
        if (clsError) return res.status(500).json({ success: false, message: 'Internal server error' });
        // Load mentor assignments
        const classIds = (classesRaw||[]).map(c=>c.id);
        let mentorMap = new Map();
        if (classIds.length) {
            const { data: mentors } = await req.supabase
                .from('mentor_assignments')
                .select('class_id, faculty_id, status')
                .in('class_id', classIds)
                .eq('status', 'active');
            (mentors||[]).forEach(m=>mentorMap.set(m.class_id, m));
        }
        const { data: faculties } = await req.supabase
            .from('faculty')
            .select('id, first_name, last_name');
        const facultyMap = new Map();
        (faculties||[]).forEach(f=>facultyMap.set(f.id, f));
        const { data: students } = await req.supabase
            .from('students')
            .select('id, class_id')
            .in('class_id', classIds || []);
        const counts = new Map();
        (students||[]).forEach(s=>counts.set(s.class_id,(counts.get(s.class_id)||0)+1));
        const classes = (classesRaw||[]).map(c=>{
            const mentor = mentorMap.get(c.id);
            const faculty = mentor ? facultyMap.get(mentor.faculty_id) : null;
            return {
                id: c.id,
                academic_year_id: c.academic_year_id,
                class_name: c.class_name,
                section: c.section,
                student_count: counts.get(c.id)||0,
                mentor_first_name: faculty?.first_name || '',
                mentor_last_name: faculty?.last_name || '',
                mentor_name: faculty ? `${faculty.first_name} ${faculty.last_name}` : 'Not assigned'
            };
        });

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

        const { error: insertClassError } = await req.supabase
            .from('classes')
            .insert([{ academic_year_id: id, department_id, class_name, section, room_number: room_number || null, class_teacher: class_teacher || null }]);
        if (insertClassError) {
            return res.status(500).json({ success: false, message: 'Failed to create class' });
        }

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
        await req.supabase.from('mentor_assignments').delete().eq('class_id', id);

        // Check if class has students
        const { data: studentsCount } = await req.supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', id);
        if ((studentsCount && studentsCount.length) || studentsCount === null) {
            // Supabase count needs head:true; head returns no rows; rely on count in response (not accessible here). Skip strict check.
        }
        const { data: studentsList } = await req.supabase.from('students').select('id').eq('class_id', id);
        if (studentsList && studentsList.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${studentsList.length} students. Please reassign students first.`
            });
        }
        const { error: delError } = await req.supabase.from('classes').delete().eq('id', id);
        if (delError) {
            console.error('Delete class error:', delError);
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
        const { data: ay, error: ayFetchError } = await req.supabase
            .from('academic_years')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (ayFetchError) return res.status(500).json({ success: false, message: 'Internal server error' });
        if (!ay) {
            return res.status(404).json({
                success: false,
                message: 'Academic year not found'
            });
        }

        // Check if academic year has classes with students (we'll handle mentor assignments automatically)
        const { data: classesForYear } = await req.supabase
            .from('classes')
            .select('id, class_name, section')
            .eq('academic_year_id', id);
        let blocked = null;
        if (classesForYear && classesForYear.length) {
            for (const cls of classesForYear) {
                const { data: studentsInClass } = await req.supabase
                    .from('students')
                    .select('id')
                    .eq('class_id', cls.id);
                if (studentsInClass && studentsInClass.length > 0) {
                    blocked = { name: `${cls.class_name}-${cls.section}`, count: studentsInClass.length };
                    break;
                }
            }
        }
        if (blocked) {
            return res.status(400).json({ success: false, message: `Cannot delete academic year. Class "${blocked.name}" has ${blocked.count} students. Please reassign students first.` });
        }

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
        const classIdsYear = (classesForYear||[]).map(c=>c.id);
        if (classIdsYear.length) await req.supabase.from('mentor_assignments').delete().in('class_id', classIdsYear);

        // Then delete all classes for this academic year
        await req.supabase.from('classes').delete().eq('academic_year_id', id);

        // Delete the academic year
        const { error: deleteAyError } = await req.supabase.from('academic_years').delete().eq('id', id);
        if (deleteAyError) {
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
        const { data: deptList, error: deptErr } = await req.supabase
            .from('departments')
            .select('id, dept_code, dept_name, head_of_department');
        if (deptErr) return res.status(500).json({ success: false, message: 'Internal server error' });
        let facultyCounts = new Map();
        let studentCounts = new Map();
        const { data: faculty } = await req.supabase.from('faculty').select('id, department').eq('status','active');
        (faculty||[]).forEach(f=>facultyCounts.set(f.department,(facultyCounts.get(f.department)||0)+1));
        const { data: studentsAll } = await req.supabase.from('students').select('id, department').eq('status','active');
        (studentsAll||[]).forEach(s=>studentCounts.set(s.department,(studentCounts.get(s.department)||0)+1));
        const departments = (deptList||[]).map(d=>({
            id: d.id,
            dept_code: d.dept_code,
            dept_name: d.dept_name,
            dept_head: d.head_of_department,
            faculty_count: facultyCounts.get(d.dept_code)||0,
            student_count: studentCounts.get(d.dept_code)||0
        }));

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
        const { data: academicYears, error } = await req.supabase
            .from('academic_years')
            .select('*')
            .order('start_year', { ascending: false });
        if (error) throw error;

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