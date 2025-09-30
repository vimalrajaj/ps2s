import bcrypt from 'bcrypt';
import { supabase } from './config/supabase.js';
import { logger } from './utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');

    // 1. Seed Departments
    const departments = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
      { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
      { name: 'Electronics & Communication', code: 'ECE', description: 'Department of Electronics and Communication Engineering' },
      { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
      { name: 'Civil Engineering', code: 'CE', description: 'Department of Civil Engineering' },
      { name: 'Electrical Engineering', code: 'EE', description: 'Department of Electrical Engineering' },
    ];

    const { data: insertedDepts, error: deptError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'code' })
      .select();

    if (deptError) throw deptError;
    logger.info(`✅ Inserted ${insertedDepts?.length} departments`);

    // 2. Seed Academic Years
    const academicYears = [
      {
        year: '2023-24',
        start_date: '2023-07-01T00:00:00.000Z',
        end_date: '2024-06-30T23:59:59.999Z',
        is_current: false,
      },
      {
        year: '2024-25',
        start_date: '2024-07-01T00:00:00.000Z',
        end_date: '2025-06-30T23:59:59.999Z',
        is_current: true,
      },
      {
        year: '2025-26',
        start_date: '2025-07-01T00:00:00.000Z',
        end_date: '2026-06-30T23:59:59.999Z',
        is_current: false,
      },
    ];

    const { data: insertedYears, error: yearError } = await supabase
      .from('academic_years')
      .upsert(academicYears, { onConflict: 'year' })
      .select();

    if (yearError) throw yearError;
    logger.info(`✅ Inserted ${insertedYears?.length} academic years`);

    // 3. Seed Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      email: 'admin@university.edu',
      password: adminPassword,
      name: 'System Administrator',
      role: 'admin',
    };

    const { data: insertedAdmin, error: adminError } = await supabase
      .from('admins')
      .upsert([adminUser], { onConflict: 'email' })
      .select();

    if (adminError) throw adminError;
    logger.info(`✅ Inserted admin user: ${adminUser.email}`);

    // 4. Seed Classes
    const cseDept = insertedDepts?.find(d => d.code === 'CSE');
    const itDept = insertedDepts?.find(d => d.code === 'IT');
    const currentYear = insertedYears?.find(y => y.is_current);

    if (cseDept && itDept && currentYear) {
      const classes = [
        {
          name: 'CSE 1st Year A',
          department_id: cseDept.id,
          academic_year_id: currentYear.id,
          semester: 1,
          section: 'A',
          max_students: 60,
        },
        {
          name: 'CSE 1st Year B',
          department_id: cseDept.id,
          academic_year_id: currentYear.id,
          semester: 1,
          section: 'B',
          max_students: 60,
        },
        {
          name: 'CSE 3rd Year A',
          department_id: cseDept.id,
          academic_year_id: currentYear.id,
          semester: 5,
          section: 'A',
          max_students: 55,
        },
        {
          name: 'IT 2nd Year A',
          department_id: itDept.id,
          academic_year_id: currentYear.id,
          semester: 3,
          section: 'A',
          max_students: 50,
        },
      ];

      const { data: insertedClasses, error: classError } = await supabase
        .from('classes')
        .upsert(classes, { onConflict: 'name' })
        .select();

      if (classError) throw classError;
      logger.info(`✅ Inserted ${insertedClasses?.length} classes`);

      // 5. Seed Faculty
      const facultyPassword = await bcrypt.hash('faculty123', 10);
      const faculty = [
        {
          email: 'dr.sharma@university.edu',
          password: facultyPassword,
          name: 'Dr. Rajesh Sharma',
          phone: '9876543201',
          department_id: cseDept.id,
          designation: 'Professor',
          specialization: 'Data Structures & Algorithms',
          qualification: 'Ph.D. Computer Science',
          experience_years: 15,
          is_active: true,
        },
        {
          email: 'prof.gupta@university.edu',
          password: facultyPassword,
          name: 'Prof. Priya Gupta',
          phone: '9876543202',
          department_id: cseDept.id,
          designation: 'Associate Professor',
          specialization: 'Machine Learning',
          qualification: 'M.Tech Computer Science',
          experience_years: 8,
          is_active: true,
        },
        {
          email: 'dr.kumar@university.edu',
          password: facultyPassword,
          name: 'Dr. Amit Kumar',
          phone: '9876543203',
          department_id: itDept.id,
          designation: 'Assistant Professor',
          specialization: 'Database Management',
          qualification: 'Ph.D. Information Technology',
          experience_years: 5,
          is_active: true,
        },
      ];

      const { data: insertedFaculty, error: facultyError } = await supabase
        .from('faculty')
        .upsert(faculty, { onConflict: 'email' })
        .select();

      if (facultyError) throw facultyError;
      logger.info(`✅ Inserted ${insertedFaculty?.length} faculty members`);

      // 6. Seed Students
      const studentPassword = await bcrypt.hash('student123', 10);
      const firstYearClass = insertedClasses?.find(c => c.semester === 1);
      const thirdYearClass = insertedClasses?.find(c => c.semester === 5);

      if (firstYearClass && thirdYearClass) {
        const students = [
          {
            email: 'rahul.singh@student.edu',
            password: studentPassword,
            name: 'Rahul Singh',
            roll_number: 'CSE2024001',
            phone: '9876543210',
            class_id: firstYearClass.id,
            date_of_birth: '2005-03-15T00:00:00.000Z',
            address: '123 Main Street, Delhi',
            guardian_name: 'Mr. Suresh Singh',
            guardian_phone: '9876543211',
            admission_date: '2024-07-15T00:00:00.000Z',
            is_active: true,
          },
          {
            email: 'priya.patel@student.edu',
            password: studentPassword,
            name: 'Priya Patel',
            roll_number: 'CSE2024002',
            phone: '9876543212',
            class_id: firstYearClass.id,
            date_of_birth: '2005-05-22T00:00:00.000Z',
            address: '456 Park Avenue, Mumbai',
            guardian_name: 'Mrs. Sunita Patel',
            guardian_phone: '9876543213',
            admission_date: '2024-07-15T00:00:00.000Z',
            is_active: true,
          },
          {
            email: 'arjun.reddy@student.edu',
            password: studentPassword,
            name: 'Arjun Reddy',
            roll_number: 'CSE2022015',
            phone: '9876543214',
            class_id: thirdYearClass.id,
            date_of_birth: '2003-08-10T00:00:00.000Z',
            address: '789 Tech City, Bangalore',
            guardian_name: 'Mr. Venkat Reddy',
            guardian_phone: '9876543215',
            admission_date: '2022-07-15T00:00:00.000Z',
            is_active: true,
          },
          {
            email: 'sneha.joshi@student.edu',
            password: studentPassword,
            name: 'Sneha Joshi',
            roll_number: 'CSE2022016',
            phone: '9876543216',
            class_id: thirdYearClass.id,
            date_of_birth: '2003-12-03T00:00:00.000Z',
            address: '321 Innovation Hub, Pune',
            guardian_name: 'Dr. Ravi Joshi',
            guardian_phone: '9876543217',
            admission_date: '2022-07-15T00:00:00.000Z',
            is_active: true,
          },
        ];

        const { data: insertedStudents, error: studentError } = await supabase
          .from('students')
          .upsert(students, { onConflict: 'email' })
          .select();

        if (studentError) throw studentError;
        logger.info(`✅ Inserted ${insertedStudents?.length} students`);
      }
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('📋 Default credentials:');
    logger.info('   Admin: admin@university.edu / admin123');
    logger.info('   Faculty: dr.sharma@university.edu / faculty123');
    logger.info('   Student: rahul.singh@student.edu / student123');

  } catch (error) {
    logger.error({ err: error }, '❌ Database seeding failed');
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };