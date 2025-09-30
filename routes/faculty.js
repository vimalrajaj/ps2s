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

// Get all departments for faculty creation form
router.get('/departments', async (req, res) => {
    try {
        const { data: departments, error } = await req.supabase
            .from('departments')
            .select('id, dept_name, dept_code')
            .order('dept_name');

        if (error) throw error;

        res.json({
            success: true,
            departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

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
        const { data: existingFaculty, error: existingError } = await req.supabase
            .from('faculty')
            .select('faculty_code, email')
            .or(`faculty_code.eq.${faculty_code},email.eq.${email}`);

        if (existingError) {
            console.error('Error checking for existing faculty:', existingError);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (existingFaculty.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Faculty with this code or email already exists'
            });
        }

        // Get department info
        const { data: departmentResult, error: deptError } = await req.supabase
            .from('departments')
            .select('id, dept_name, dept_code')
            .eq('id', department)
            .single();

        if (deptError || !departmentResult) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        const departmentName = departmentResult.dept_name;
        const departmentCode = departmentResult.dept_code;
        const departmentId = departmentResult.id;
        const bcrypt = require('bcryptjs');
        const plainPassword = password || faculty_code;
        let facultyPassword = plainPassword;
        try {
            facultyPassword = await bcrypt.hash(plainPassword, 10);
        } catch (e) {
            console.warn('Password hash failed for faculty, storing plain temporarily (NOT recommended):', e.message);
        }

        // Insert faculty with all form data, handle empty date_of_joining
        const joiningDate = date_of_joining && date_of_joining.trim() !== '' ? date_of_joining : new Date().toISOString().split('T')[0];
        
        const { error: insertError } = await req.supabase
            .from('faculty')
            .insert([{
                faculty_code, first_name, last_name, email, phone,
                department: departmentCode, designation, qualification,
                experience_years: experience_years || 0, 
                date_of_joining: joiningDate, 
                password: facultyPassword, 
                status: 'active'
            }]);

        if (insertError) {
            console.error('Error creating faculty:', insertError);
            return res.status(500).json({ success: false, message: 'Failed to create faculty account.' });
        }

        // If designation is HOD, update the department table
        if (designation === 'HOD' || designation === 'Head of Department (HOD)') {
            const hodName = `${first_name} ${last_name}`;
            
            const { error: updateDeptError } = await req.supabase
                .from('departments')
                .update({ head_of_department: hodName })
                .eq('id', departmentId);

            if (updateDeptError) {
                console.error('Error updating HOD in department:', updateDeptError);
                // Non-critical error, so we can just log it and continue
            }
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
        const { data: faculty, error } = await req.supabase
            .from('faculty')
            .select(`
                id, faculty_code, first_name, last_name, email, phone,
                department, designation, qualification,
                experience_years, date_of_joining, status, created_at
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

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
        
        const { data: departmentResult, error: deptError } = await req.supabase
            .from('departments')
            .select('dept_name, dept_code')
            .eq('id', departmentId)
            .single();

        if (deptError || !departmentResult) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const departmentName = departmentResult.dept_name;
        const departmentCode = departmentResult.dept_code;

        const { data: faculty, error: facultyError } = await req.supabase
            .from('faculty')
            .select('*')
            .eq('department', departmentCode)
            .eq('status', 'active')
            .order('designation')
            .order('first_name');

        if (facultyError) throw facultyError;

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
    // Table creation is managed via Supabase migrations / SQL editor
    return res.json({ success: true, message: 'In Supabase, create tables via SQL Editor or migrations. No runtime action performed.' });
});

// Assign mentor to class
router.post('/assign-mentor', async (req, res) => {
    try {
        const { class_id, faculty_id, notes } = req.body;
        if (!class_id || !faculty_id) {
            return res.status(400).json({ success: false, message: 'Class ID and Faculty ID are required' });
        }

        // Check class
        const { data: classData, error: classError } = await req.supabase
            .from('classes')
            .select('id, class_name, section, academic_year_id, department_id')
            .eq('id', class_id)
            .single();
        if (classError || !classData) return res.status(404).json({ success: false, message: 'Class not found' });

        // Academic year
        const { data: ayData } = await req.supabase
            .from('academic_years')
            .select('year_range')
            .eq('id', classData.academic_year_id)
            .maybeSingle();
        // Department
        const { data: deptData } = await req.supabase
            .from('departments')
            .select('dept_name')
            .eq('id', classData.department_id)
            .maybeSingle();

        // Check faculty
        const { data: facultyData, error: facError } = await req.supabase
            .from('faculty')
            .select('id, first_name, last_name, faculty_code')
            .eq('id', faculty_id)
            .eq('status', 'active')
            .single();
        if (facError || !facultyData) return res.status(404).json({ success: false, message: 'Faculty not found or inactive' });

        // Existing mentor
        const { data: existingMentor, error: existingError } = await req.supabase
            .from('mentor_assignments')
            .select('id')
            .eq('class_id', class_id)
            .maybeSingle();
        if (existingError && existingError.code !== 'PGRST116') console.warn('Mentor lookup error:', existingError);

        if (existingMentor) {
            const { error: updateError } = await req.supabase
                .from('mentor_assignments')
                .update({ faculty_id, notes: notes || null, status: 'active' })
                .eq('class_id', class_id);
            if (updateError) return res.status(500).json({ success: false, message: 'Failed to update mentor assignment' });
        } else {
            const { error: insertError } = await req.supabase
                .from('mentor_assignments')
                .insert([{ class_id, faculty_id, notes: notes || null, status: 'active' }]);
            if (insertError) return res.status(500).json({ success: false, message: 'Failed to create mentor assignment' });
        }

        res.json({
            success: true,
            message: 'Mentor assigned successfully',
            assignment: {
                class: `${classData.class_name} - Section ${classData.section}`,
                academic_year: ayData?.year_range,
                department: deptData?.dept_name,
                mentor: `${facultyData.first_name} ${facultyData.last_name}`,
                faculty_code: facultyData.faculty_code
            }
        });
    } catch (error) {
        console.error('Error assigning mentor:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all mentor assignments
router.get('/mentor-assignments', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('mentor_assignments')
            .select(`id, assignment_date, status, class_id, faculty_id, notes,
                     classes ( class_name, section, total_students, academic_year_id, department_id ),
                     faculty ( first_name, last_name, faculty_code, email, phone, designation )`)
            .eq('status', 'active');
        if (error) throw error;

        // Count students per class
        const classIds = [...new Set((data||[]).map(a => a.class_id))];
        let countsMap = new Map();
        if (classIds.length) {
            const { data: students, error: stuErr } = await req.supabase
                .from('students')
                .select('id, class_id')
                .in('class_id', classIds)
                .eq('status', 'active');
            if (!stuErr) {
                students.forEach(s => countsMap.set(s.class_id, (countsMap.get(s.class_id)||0)+1));
            }
        }

        const assignments = (data||[]).map(a => ({
            id: a.id,
            assignment_date: a.assignment_date,
            status: a.status,
            class_name: a.classes?.class_name,
            section: a.classes?.section,
            total_students: a.classes?.total_students,
            year_range: a.classes?.academic_years?.year_range, // may need explicit join if relation named
            department_name: a.classes?.departments?.dept_name,
            first_name: a.faculty?.first_name,
            last_name: a.faculty?.last_name,
            faculty_code: a.faculty?.faculty_code,
            email: a.faculty?.email,
            phone: a.faculty?.phone,
            designation: a.faculty?.designation,
            student_count: countsMap.get(a.class_id) || 0
        }));

        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Error fetching mentor assignments:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove mentor assignment
router.delete('/mentor-assignment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error, data } = await req.supabase
            .from('mentor_assignments')
            .update({ status: 'inactive' })
            .eq('id', id)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ success: false, message: 'Mentor assignment not found' });
        res.json({ success: true, message: 'Mentor assignment removed successfully' });
    } catch (error) {
        console.error('Error removing mentor assignment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all faculty with detailed information for dashboard
router.get('/faculty/all-details', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('faculty')
            .select('id, faculty_code, first_name, last_name, email, phone, department, designation, qualification, experience_years, date_of_joining, status, created_at')
            .eq('status', 'active')
            .order('faculty_code');
        if (error) throw error;
        console.log('👨‍🏫 Fetched', data.length, 'faculty for detailed view');
        res.json({ success: true, faculty: data, count: data.length });
    } catch (error) {
        console.error('Error fetching all faculty details:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
        const { data: classAssignments, error: assignError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active');
        if (assignError) throw assignError;
        const classIds = (classAssignments || []).map(a => a.class_id);
        let totalStudents = 0;
        if (classIds.length) {
            const { data: students, error: stuError } = await req.supabase
                .from('students')
                .select('id, class_id')
                .in('class_id', classIds)
                .eq('status', 'active');
            if (!stuError) totalStudents = students.length;
        }

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
        const { data: classAssignments, error: assignError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active');
        if (assignError) throw assignError;
        const classIds = (classAssignments||[]).map(a=>a.class_id);
        if (!classIds.length) return res.json([]);
        const { data: students, error: studentsError } = await req.supabase
            .from('students')
            .select('id, register_number, first_name, last_name, email, status, class_id')
            .in('class_id', classIds)
            .eq('status', 'active')
            .order('first_name')
            .order('last_name');
        if (studentsError) throw studentsError;
        const response = students.map(s => ({
            student_id: s.id,
            register_number: s.register_number,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            current_cgpa: 0,
            enrollment_status: s.status,
            class_id: s.class_id,
            course_name: 'Class ' + s.class_id,
            dept_name: null,
            total_certificates: 0
        }));
        res.json(response);

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
        const { data: assignments, error: assignError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id, assignment_date, notes')
            .eq('faculty_id', facultyId)
            .eq('status', 'active');
        if (assignError) throw assignError;
        const classIds = (assignments||[]).map(a=>a.class_id);
        if (!classIds.length) return res.json([]);
        const { data: classesData, error: classError } = await req.supabase
            .from('classes')
            .select('id, class_name, section, capacity, current_strength, academic_year_id, department_id')
            .in('id', classIds);
        if (classError) throw classError;
        const response = classesData.map(c => ({
            class_id: c.id,
            class_name: c.class_name,
            section: c.section,
            max_students: c.capacity,
            current_students: c.current_strength,
            course_id: c.id,
            course_name: `${c.class_name} - Section ${c.section}`,
            dept_name: null,
            year_name: null,
            current_semester: 1,
            assignment_date: assignments.find(a=>a.class_id===c.id)?.assignment_date,
            notes: assignments.find(a=>a.class_id===c.id)?.notes
        }));
        res.json(response);

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
        const { data: assignments, error: assignError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active');
        if (assignError) throw assignError;
        const classIds = (assignments||[]).map(a=>a.class_id);
        if (!classIds.length) return res.json([]);
        const { data: students, error: stuError } = await req.supabase
            .from('students')
            .select('id, first_name, last_name, email, register_number, class_id, created_at, status')
            .in('class_id', classIds)
            .order('created_at', { ascending: false })
            .limit(10);
        if (stuError) throw stuError;
        const activities = students.map(s => ({
            student_id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            register_number: s.register_number,
            course: 'Class ' + s.class_id,
            cgpa: 0,
            last_activity: s.created_at,
            status: s.status
        }));
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
        const { data: assignments, error: assignError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active');
        if (assignError) throw assignError;
        const classIds = (assignments||[]).map(a=>a.class_id);
        let departmentStats = [];
        if (classIds.length) {
            const { data: students, error: stuError } = await req.supabase
                .from('students')
                .select('id, department')
                .in('class_id', classIds)
                .eq('status', 'active');
            if (!stuError) {
                const counts = {};
                students.forEach(s => { if (s.department) counts[s.department] = (counts[s.department]||0)+1; });
                departmentStats = Object.entries(counts).map(([dept_code, student_count]) => ({ dept_name: dept_code, student_count }));
            }
        }

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
        const { data, error } = await req.supabase
            .from('academic_years')
            .select('id, year_range')
            .eq('status', 'active')
            .order('start_year', { ascending: false });
        if (error) throw error;
        const academicYears = (data||[]).map(a => ({ id: a.id, year_name: a.year_range }));
        res.json(academicYears);
    } catch (error) {
        console.error('❌ Academic Years Error:', error);
        res.status(500).json({ success: false, message: 'Error loading academic years' });
    }
});

// Get subjects by semester and academic year
router.get('/faculty/subjects', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { semester, academic_year } = req.query;
        if (!semester) return res.status(400).json({ success: false, message: 'Semester is required' });
        let query = req.supabase.from('subjects').select('*').eq('semester', semester);
        if (academic_year) {
            let ay = academic_year;
            if (ay.includes(' - ')) { const startYear = ay.split(' - ')[0]; const nextYear = (parseInt(startYear)+1).toString().slice(-2); ay = `${startYear}-${nextYear}`; }
            query = query.eq('academic_year', ay);
        }
        const { data, error } = await query.order('subject_name');
        if (error) throw error;
        res.json(data||[]);
    } catch (error) {
        console.error('❌ Subjects Error:', error);
        res.status(500).json({ success: false, message: 'Error loading subjects' });
    }
});

// Add internal assessment
router.post('/faculty/add-internal-assessment', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { iaNumber, subjectId, academicYearId, semester } = req.body;
        const facultyId = req.session.user.id;
        const { data: mentor, error: mentorError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active')
            .single();
        if (mentorError || !mentor) return res.status(400).json({ success: false, message: 'No class assigned to this faculty' });
        const classId = mentor.class_id;
        const { data: existing, error: existingError } = await req.supabase
            .from('internal_assessments')
            .select('id')
            .match({ ia_number: iaNumber, subject_id: subjectId, academic_year_id: academicYearId, semester, class_id: classId })
            .maybeSingle();
        if (existingError) console.warn('Existing IA check error:', existingError);
        if (existing) return res.status(400).json({ success: false, message: 'This Internal Assessment already exists' });
        const { data: inserted, error: insertError } = await req.supabase
            .from('internal_assessments')
            .insert([{ ia_number: iaNumber, subject_id: subjectId, academic_year_id: academicYearId, semester, class_id: classId, faculty_id: facultyId }])
            .select('id')
            .single();
        if (insertError) return res.status(500).json({ success: false, message: 'Failed to create IA' });
        const iaId = inserted.id;
        const { data: students, error: stuError } = await req.supabase
            .from('students')
            .select('id')
            .eq('class_id', classId)
            .eq('status', 'active');
        if (!stuError && students.length) {
            const initial = students.map(s => ({ student_id: s.id, internal_assessment_id: iaId, marks_obtained: 0, attendance: 'Present' }));
            await req.supabase.from('student_marks').insert(initial);
        }
        res.json({ success: true, message: 'Internal Assessment added successfully' });
    } catch (error) {
        console.error('❌ Add IA Error:', error);
        res.status(500).json({ success: false, message: 'Error adding internal assessment' });
    }
});

// Get internal assessments
router.get('/faculty/internal-assessments', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { academicYearId, semester } = req.query;
        const facultyId = req.session.user.id;
        const { data: mentor, error: mentorError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active')
            .single();
        if (mentorError || !mentor) return res.json([]);
        const classId = mentor.class_id;
        const { data: assessments, error: iaError } = await req.supabase
            .from('internal_assessments')
            .select('id, ia_number, subject_id, semester, academic_year_id, class_id, faculty_id')
            .match({ academic_year_id: academicYearId, semester, class_id: classId })
            .order('ia_number', { ascending: true });
        if (iaError) throw iaError;
        // Enrich with subject info
        const subjectIds = [...new Set((assessments||[]).map(a=>a.subject_id))];
        let subjectMap = new Map();
        if (subjectIds.length) {
            const { data: subjects, error: subjErr } = await req.supabase
                .from('subjects')
                .select('subject_id, subject_name, subject_code')
                .in('subject_id', subjectIds);
            if (!subjErr) subjects.forEach(s => subjectMap.set(s.subject_id, s));
        }
        const result = (assessments||[]).map(a => ({ ...a, subject_name: subjectMap.get(a.subject_id)?.subject_name, subject_code: subjectMap.get(a.subject_id)?.subject_code }));
        res.json(result);
    } catch (error) {
        console.error('❌ Internal Assessments Error:', error);
        res.status(500).json({ success: false, message: 'Error loading internal assessments' });
    }
});

// Get student marks for specific IA and subject
router.get('/faculty/student-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { iaNumber, subjectId, academicYearId, semester } = req.query;
        const facultyId = req.session.user.id;

        // 1. Get faculty's active class (mentor assignment)
        const { data: mentorAssignment, error: mentorError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active')
            .single();

        if (mentorError || !mentorAssignment) {
            return res.status(400).json({ success: false, message: 'No class assigned to this faculty' });
        }
        const classId = mentorAssignment.class_id;

        // 2. Get subject name
        const { data: subject, error: subjectError } = await req.supabase
            .from('subjects')
            .select('subject_name')
            .eq('subject_id', subjectId)
            .single();
        if (subjectError || !subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // 3. Get Internal Assessment (IA) record
        const { data: iaRecord, error: iaError } = await req.supabase
            .from('internal_assessments')
            .select('id')
            .match({
                ia_number: iaNumber,
                subject_id: subjectId,
                academic_year_id: academicYearId,
                semester: semester,
                class_id: classId
            })
            .single();
        if (iaError || !iaRecord) {
            return res.status(400).json({ success: false, message: 'Internal Assessment not found' });
        }
        const iaId = iaRecord.id;

        // 4. Get students in class
        const { data: studentsRaw, error: studentsError } = await req.supabase
            .from('students')
            .select('id, first_name, last_name, register_number')
            .eq('class_id', classId)
            .eq('status', 'active')
            .order('first_name', { ascending: true })
            .order('last_name', { ascending: true });
        if (studentsError) throw studentsError;

        // 5. Get marks for those students for this IA
        const { data: marks, error: marksError } = await req.supabase
            .from('student_marks')
            .select('student_id, marks_obtained, attendance, remarks')
            .eq('internal_assessment_id', iaId);
        if (marksError) throw marksError;

        const marksMap = new Map();
        marks?.forEach(m => marksMap.set(m.student_id, m));

        const students = (studentsRaw || []).map(s => ({
            student_id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            register_number: s.register_number,
            marks_obtained: marksMap.get(s.id)?.marks_obtained ?? null,
            attendance: marksMap.get(s.id)?.attendance ?? null,
            remarks: marksMap.get(s.id)?.remarks ?? null,
            internal_assessment_id: iaId
        }));

        res.json({ success: true, students, subjectName: subject.subject_name });
    } catch (error) {
        console.error('❌ Student Marks Error:', error);
        res.status(500).json({ success: false, message: 'Error loading student marks' });
    }
});

// Save student marks
router.post('/faculty/save-student-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const { marksData } = req.body;
        if (!Array.isArray(marksData)) {
            return res.status(400).json({ success: false, message: 'marksData must be an array' });
        }

        // Prepare rows for upsert (requires a UNIQUE constraint on (student_id, internal_assessment_id))
        const rows = marksData.map(m => ({
            student_id: m.studentId,
            internal_assessment_id: m.internalAssessmentId,
            marks_obtained: m.marksObtained,
            attendance: m.attendanceStatus,
            remarks: m.remarks
        }));

        const { error } = await req.supabase
            .from('student_marks')
            .upsert(rows, { onConflict: 'student_id,internal_assessment_id' });

        if (error) {
            console.error('Upsert marks error:', error);
            return res.status(500).json({ success: false, message: 'Failed to save marks' });
        }

        res.json({ success: true, message: 'All marks saved successfully' });
    } catch (error) {
        console.error('❌ Save Marks Error:', error);
        res.status(500).json({ success: false, message: 'Error saving marks' });
    }
});

// Upload marks from Excel/CSV file
router.post('/faculty/upload-marks', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
        const XLSX = require('xlsx');
        if (!req.files || !req.files.marksFile) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const file = req.files.marksFile;
        const facultyId = req.session.user.id;
        console.log(`📁 File uploaded: ${file.name}, size: ${file.size}, mimetype: ${file.mimetype}`);

        // Faculty class
        const { data: mentorAssignment, error: mentorError } = await req.supabase
            .from('mentor_assignments')
            .select('class_id')
            .eq('faculty_id', facultyId)
            .eq('status', 'active')
            .single();
        if (mentorError || !mentorAssignment) {
            return res.status(400).json({ success: false, message: 'No class assigned to this faculty' });
        }
        const classId = mentorAssignment.class_id;

        let jsonData = [];
        if (file.name.toLowerCase().endsWith('.csv')) {
            const csvContent = file.data.toString('utf8');
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim());
                const rowData = {};
                headers.forEach((header, index) => { rowData[header] = values[index] || ''; });
                jsonData.push(rowData);
            }
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            const workbook = XLSX.read(file.data, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length > 0) {
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);
                jsonData = dataRows.map(row => {
                    const rowData = {}; headers.forEach((header, index) => { rowData[header] = row[index] || ''; }); return rowData; });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported file format. Use CSV or Excel.' });
        }

        const results = { totalRecords: jsonData.length, successCount: 0, errorCount: 0, processedData: [] };
        console.log(`📋 Total records to process: ${jsonData.length}`);

        for (let i = 0; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            let record;
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
                if (!record.studentId || !record.subjectCode || isNaN(record.marks)) {
                    record.status = 'Error: Missing required fields';
                    results.errorCount++; results.processedData.push(record); continue;
                }

                // Student lookup
                const { data: studentLookup, error: studentError } = await req.supabase
                    .from('students')
                    .select('id')
                    .eq('register_number', record.studentId)
                    .eq('class_id', classId)
                    .single();
                if (studentError || !studentLookup) { record.status = 'Error: Student not found'; results.errorCount++; results.processedData.push(record); continue; }

                // Subject lookup
                const { data: subjectLookup, error: subjError } = await req.supabase
                    .from('subjects')
                    .select('subject_id')
                    .eq('subject_code', record.subjectCode)
                    .eq('semester', record.semester)
                    .single();
                if (subjError || !subjectLookup) { record.status = 'Error: Subject not found'; results.errorCount++; results.processedData.push(record); continue; }
                const subjectId = subjectLookup.subject_id;

                // IA lookup / create (assumes academic_year_id = 1 placeholder)
                const { data: iaLookup, error: iaLookupError } = await req.supabase
                    .from('internal_assessments')
                    .select('id')
                    .match({ ia_number: record.ia, subject_id: subjectId, semester: record.semester, class_id: classId, faculty_id: facultyId })
                    .maybeSingle();
                let iaId;
                if (!iaLookup || iaLookupError) {
                    const { data: iaInsert, error: iaInsertError } = await req.supabase
                        .from('internal_assessments')
                        .insert([{ ia_number: record.ia, subject_id: subjectId, academic_year_id: 1, semester: record.semester, class_id: classId, faculty_id: facultyId }])
                        .select('id')
                        .single();
                    if (iaInsertError) { record.status = 'Error: Failed to create IA'; results.errorCount++; results.processedData.push(record); continue; }
                    iaId = iaInsert.id;
                } else {
                    iaId = iaLookup.id;
                }

                // Upsert marks
                const { error: marksError } = await req.supabase
                    .from('student_marks')
                    .upsert([{ student_id: studentLookup.id, internal_assessment_id: iaId, marks_obtained: record.marks, attendance: 'Present' }], { onConflict: 'student_id,internal_assessment_id' });
                if (marksError) { record.status = 'Error: Saving marks failed'; results.errorCount++; results.processedData.push(record); continue; }

                record.status = 'Success';
                results.successCount++; results.processedData.push(record);
            } catch (err) {
                console.error('Error processing record:', err);
                if (!record) { record = { raw: rowData }; }
                record.status = 'Error: ' + err.message;
                results.errorCount++; results.processedData.push(record);
            }
        }

        res.json({ success: true, message: 'File processed successfully', results });
    } catch (error) {
        console.error('❌ Upload Marks Error:', error);
        res.status(500).json({ success: false, message: 'Error processing file' });
    }
});

module.exports = router;
