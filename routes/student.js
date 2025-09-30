const express = require('express');
const router = express.Router();

// Get all departments for student creation form
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

// Get classes by department for student creation
router.get('/departments/:departmentId/classes', async (req, res) => {
    try {
        const { departmentId } = req.params;
        
        const { data: classes, error } = await req.supabase
            .from('classes')
            .select(`
                id,
                class_name,
                section,
                capacity,
                total_students,
                academic_years ( year_range, status )
            `)
            .eq('department_id', departmentId)
            .order('class_name')
            .order('section');

        if (error) throw error;

        // Filter to show only classes with available capacity
        const availableClasses = classes.filter(cls => 
            cls.total_students < cls.capacity && 
            cls.academic_years.status === 'active'
        );

        res.json({
            success: true,
            classes: availableClasses
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

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
        const { data: existingStudent, error: existingError } = await req.supabase
            .from('students')
            .select('register_number, email')
            .or(`register_number.eq.${register_number},email.eq.${email}`);

        if (existingError) {
            console.error('Error checking for existing student:', existingError);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (existingStudent.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student with this register number or email already exists'
            });
        }

        // Get department name and class details
        const { data: departmentResult, error: deptError } = await req.supabase
            .from('departments')
            .select('dept_name, dept_code')
            .eq('id', department)
            .single();

        const { data: classResult, error: classError } = await req.supabase
            .from('classes')
            .select(`
                *,
                academic_years ( year_range )
            `)
            .eq('id', class_id)
            .single();
        
        if (deptError || !departmentResult) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        if (classError || !classResult) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class selected'
            });
        }

        const departmentName = departmentResult.dept_name;
        const departmentCode = departmentResult.dept_code;
        const classInfo = classResult;
        
        // Check if class has available capacity (default capacity: 60 students)
        const maxCapacity = classInfo.capacity || 60;
        if (classInfo.total_students >= maxCapacity) {
            return res.status(400).json({
                success: false,
                message: 'Selected class is full. Please choose another class.'
            });
        }

        const bcrypt = require('bcryptjs');
        const plainPassword = password || register_number;
        let studentPassword = plainPassword;
        try {
            studentPassword = await bcrypt.hash(plainPassword, 10);
        } catch (e) {
            console.warn('Password hash failed, storing plain temporarily (NOT recommended):', e.message);
        }

        // NOTE: For production, wrap these two operations in a Supabase RPC function for transactional integrity.
        // 1. Insert the new student
        const { error: insertError } = await req.supabase
            .from('students')
            .insert([{
                register_number, first_name, last_name, email, phone, 
                date_of_birth, gender, department: departmentCode, class_id, current_semester: current_semester || 1, current_year: current_year || 1,
                parent_name, parent_phone, address, password: studentPassword, status: 'active'
            }]);

        if (insertError) {
            console.error('Error inserting student:', insertError);
            return res.status(500).json({ success: false, message: 'Failed to create student account.' });
        }

        // 2. Update the class count
        const { error: updateError } = await req.supabase
            .rpc('increment_class_students', { class_id_to_update: class_id });

        if (updateError) {
            console.error('Error updating class count:', updateError);
            // If this fails, we should ideally roll back the student insertion.
            // This is why an RPC function is recommended.
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
                academic_year: classInfo.academic_years.year_range
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
        const { data: students, error } = await req.supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

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

        const { data: students, error: studentsError } = await req.supabase
            .from('students')
            .select(`
                *,
                classes ( class_name, section, class_teacher, academic_years ( year_range, start_year, end_year ), departments ( dept_name, dept_code ) ),
                current_semester,
                current_year,
                parent_name,
                parent_phone,
                address,
                status
            `)
            .eq('class_id', classId)
            .order('first_name', { ascending: true })
            .order('last_name', { ascending: true });

        if (studentsError) throw studentsError;

        console.log('📊 Found', students.length, 'students for class', classId);
        console.log('👥 Students:', students.map(s => `${s.first_name} ${s.last_name} (${s.register_number})`));

        // Get mentor information from mentor_assignments table
        const { data: mentorResult, error: mentorError } = await req.supabase
            .from('mentor_assignments')
            .select(`
                assignment_date,
                status,
                faculty ( id, first_name, last_name, email, phone, designation, faculty_code )
            `)
            .eq('class_id', classId)
            .eq('status', 'active')
            .limit(1)
            .single();
        
        let mentor = null;
        if (mentorResult && !mentorError) {
            mentor = {
                faculty_id: mentorResult.faculty.id,
                name: `${mentorResult.faculty.first_name} ${mentorResult.faculty.last_name}`,
                email: mentorResult.faculty.email,
                phone: mentorResult.faculty.phone,
                designation: mentorResult.faculty.designation,
                faculty_code: mentorResult.faculty.faculty_code,
                assignment_date: mentorResult.assignment_date,
                status: mentorResult.status
            };
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
// Get individual student details by register number
router.get('/student/:registerNumber', async (req, res) => {
    try {
        const { registerNumber } = req.params;

        const { data: student, error } = await req.supabase
            .from('students')
            .select(`
                *,
                classes ( class_name, section, academic_years ( year_range ) ),
                departments ( dept_name, dept_code )
            `)
            .eq('register_number', registerNumber)
            .single();

        if (error || !student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        res.json(student);

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
        const { data: students, error } = await req.supabase
            .from('students')
            .select(`
                id,
                register_number,
                first_name,
                last_name,
                email,
                phone,
                date_of_birth,
                gender,
                department,
                departments ( dept_name, dept_code ),
                current_semester,
                current_year,
                parent_name,
                parent_phone,
                address,
                status,
                created_at,
                class_id
            `)
            .eq('status', 'active')
            .order('register_number');

        if (error) throw error;

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
        
        const { data: student, error } = await req.supabase
            .from('students')
            .select(`
                *,
                classes ( class_name, department, semester, academic_year )
            `)
            .eq('id', studentId)
            .single();

        if (error || !student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

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
