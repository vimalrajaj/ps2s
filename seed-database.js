const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Create Departments
        console.log('📚 Creating departments...');
        const departments = [
            { dept_name: 'Computer Science & Engineering', dept_code: 'CSE', description: 'Computer Science and Engineering Department' },
            { dept_name: 'Information Technology', dept_code: 'IT', description: 'Information Technology Department' },
            { dept_name: 'Electronics & Communication', dept_code: 'ECE', description: 'Electronics and Communication Engineering' },
            { dept_name: 'Mechanical Engineering', dept_code: 'MECH', description: 'Mechanical Engineering Department' },
            { dept_name: 'Civil Engineering', dept_code: 'CIVIL', description: 'Civil Engineering Department' }
        ];

        const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .upsert(departments, { onConflict: 'dept_code' })
            .select();

        if (deptError) {
            console.error('Error creating departments:', deptError);
            return;
        }
        console.log(`✅ Created ${deptData.length} departments`);

        // 2. Create Academic Years
        console.log('📅 Creating academic years...');
        const academicYears = [
            { year_range: '2023-2024', start_year: 2023, end_year: 2024, status: 'completed' },
            { year_range: '2024-2025', start_year: 2024, end_year: 2025, status: 'active' },
            { year_range: '2025-2026', start_year: 2025, end_year: 2026, status: 'upcoming' }
        ];

        const { data: yearData, error: yearError } = await supabase
            .from('academic_years')
            .upsert(academicYears, { onConflict: 'year_range' })
            .select();

        if (yearError) {
            console.error('Error creating academic years:', yearError);
            return;
        }
        console.log(`✅ Created ${yearData.length} academic years`);

        // 3. Create Classes for each department and current academic year
        console.log('🏫 Creating classes...');
        const currentAcademicYear = yearData.find(y => y.status === 'active');
        const classes = [];

        deptData.forEach(dept => {
            // Create classes for different years (1st, 2nd, 3rd, 4th)
            for (let year = 1; year <= 4; year++) {
                classes.push({
                    academic_year_id: currentAcademicYear.id,
                    department_id: dept.id,
                    class_name: `${year}${getYearSuffix(year)} Year`,
                    section: 'A',
                    capacity: 60,
                    total_students: 0
                });
                classes.push({
                    academic_year_id: currentAcademicYear.id,
                    department_id: dept.id,
                    class_name: `${year}${getYearSuffix(year)} Year`,
                    section: 'B',
                    capacity: 60,
                    total_students: 0
                });
            }
        });

        const { data: classData, error: classError } = await supabase
            .from('classes')
            .upsert(classes, { onConflict: 'academic_year_id,department_id,class_name,section' })
            .select();

        if (classError) {
            console.error('Error creating classes:', classError);
            return;
        }
        console.log(`✅ Created ${classData.length} classes`);

        // 4. Create sample subjects for each department
        console.log('📖 Creating subjects...');
        const subjects = [];
        
        const subjectTemplates = {
            'CSE': [
                { code: 'CS101', name: 'Programming Fundamentals', semester: 1, credits: 4 },
                { code: 'CS102', name: 'Data Structures', semester: 2, credits: 4 },
                { code: 'CS201', name: 'Database Management Systems', semester: 3, credits: 3 },
                { code: 'CS202', name: 'Computer Networks', semester: 4, credits: 3 }
            ],
            'IT': [
                { code: 'IT101', name: 'Introduction to IT', semester: 1, credits: 3 },
                { code: 'IT102', name: 'Web Technologies', semester: 2, credits: 4 },
                { code: 'IT201', name: 'Software Engineering', semester: 3, credits: 3 },
                { code: 'IT202', name: 'Network Security', semester: 4, credits: 3 }
            ],
            'ECE': [
                { code: 'EC101', name: 'Electronic Devices', semester: 1, credits: 4 },
                { code: 'EC102', name: 'Digital Electronics', semester: 2, credits: 4 },
                { code: 'EC201', name: 'Communication Systems', semester: 3, credits: 3 },
                { code: 'EC202', name: 'Microprocessors', semester: 4, credits: 3 }
            ]
        };

        deptData.forEach(dept => {
            const templates = subjectTemplates[dept.dept_code] || [];
            templates.forEach(template => {
                subjects.push({
                    subject_code: template.code,
                    subject_name: template.name,
                    department_id: dept.id,
                    academic_year_id: currentAcademicYear.id,
                    semester: template.semester,
                    credits: template.credits,
                    subject_type: 'Theory',
                    is_elective: false
                });
            });
        });

        if (subjects.length > 0) {
            const { data: subjectData, error: subjectError } = await supabase
                .from('subjects')
                .upsert(subjects, { onConflict: 'subject_code,department_id,academic_year_id' })
                .select();

            if (subjectError) {
                console.error('Error creating subjects:', subjectError);
            } else {
                console.log(`✅ Created ${subjectData.length} subjects`);
            }
        }

        // 5. Create sample admin user in faculty table (for institution management)
        console.log('👨‍💼 Creating admin user...');
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        const { data: adminData, error: adminError } = await supabase
            .from('faculty')
            .upsert([{
                faculty_code: 'ADMIN001',
                first_name: 'System',
                last_name: 'Administrator',
                email: 'admin@institution.edu',
                department: 'ADMIN',
                designation: 'Administrator',
                password: adminPassword,
                status: 'active'
            }], { onConflict: 'faculty_code' })
            .select();

        if (adminError) {
            console.error('Error creating admin:', adminError);
        } else {
            console.log('✅ Created admin user (faculty_code: ADMIN001, password: admin123)');
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 You can now:');
        console.log('1. Login as admin: username=admin, password=admin123 (hardcoded)');
        console.log('2. Login as faculty admin: username=ADMIN001, password=admin123');
        console.log('3. Create students and faculty through the web interface');
        console.log('4. Assign mentors to classes');
        console.log('5. Create internal assessments and manage marks');

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
    }
}

function getYearSuffix(year) {
    switch(year) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        case 4: return 'th';
        default: return 'th';
    }
}

// Run seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };