const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university_portal'
};

async function debugFacultyFlow() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Test Faculty Data
        console.log('\n🔍 1. CHECKING FACULTY DATA:');
        const [faculty] = await connection.execute('SELECT * FROM faculty WHERE faculty_code = "3"');
        if (faculty.length > 0) {
            console.log('✅ Faculty found:', {
                id: faculty[0].id,
                code: faculty[0].faculty_code,
                name: `${faculty[0].first_name} ${faculty[0].last_name}`,
                department: faculty[0].department,
                designation: faculty[0].designation
            });
        } else {
            console.log('❌ Faculty not found!');
            return;
        }

        const facultyId = faculty[0].id;

        // Test Mentor Assignments
        console.log('\n🔍 2. CHECKING MENTOR ASSIGNMENTS:');
        const [mentorAssignments] = await connection.execute(`
            SELECT 
                ma.id, ma.faculty_id, ma.class_id, ma.status,
                c.class_name, c.section,
                f.first_name, f.last_name
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN faculty f ON ma.faculty_id = f.id
            WHERE f.faculty_code = "3"
        `);
        
        if (mentorAssignments.length > 0) {
            console.log('✅ Mentor assignments found:');
            mentorAssignments.forEach(assignment => {
                console.log(`   - Class ${assignment.class_name} Section ${assignment.section} (Status: ${assignment.status})`);
            });
        } else {
            console.log('❌ No mentor assignments found!');
            return;
        }

        // Test Students in Mentor's Classes
        console.log('\n🔍 3. CHECKING STUDENTS IN MENTOR\'S CLASSES:');
        const [students] = await connection.execute(`
            SELECT 
                s.id as student_id,
                s.register_number,
                s.first_name,
                s.last_name,
                s.email,
                s.status as enrollment_status,
                c.id as class_id,
                c.class_name,
                c.section
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN students s ON s.class_id = c.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            ORDER BY c.class_name, s.first_name
        `, [facultyId]);

        if (students.length > 0) {
            console.log(`✅ Found ${students.length} students:`);
            students.forEach(student => {
                console.log(`   - ${student.first_name} ${student.last_name} (${student.register_number}) - Class: ${student.class_name}`);
            });
        } else {
            console.log('❌ No students found in mentor\'s classes!');
        }

        // Test Dashboard Stats Query
        console.log('\n🔍 4. TESTING DASHBOARD STATS QUERY:');
        const [dashboardStats] = await connection.execute(`
            SELECT 
                c.id as class_id,
                c.class_name,
                c.section,
                COUNT(s.id) as student_count
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            LEFT JOIN students s ON s.class_id = c.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            GROUP BY c.id, c.class_name, c.section
        `, [facultyId]);

        let totalStudents = 0;
        if (dashboardStats.length > 0) {
            console.log('✅ Dashboard stats:');
            dashboardStats.forEach(stat => {
                console.log(`   - ${stat.class_name} Section ${stat.section}: ${stat.student_count} students`);
                totalStudents += stat.student_count;
            });
            console.log(`   📊 Total Students: ${totalStudents}`);
        } else {
            console.log('❌ No dashboard stats found!');
        }

        // Test Class Details Query
        console.log('\n🔍 5. TESTING CLASS DETAILS QUERY:');
        const [classDetails] = await connection.execute(`
            SELECT 
                c.id as class_id,
                c.class_name,
                c.section,
                c.capacity as max_students,
                c.current_strength as current_students,
                d.name as dept_name,
                ay.year_range as year_name
            FROM mentor_assignments ma
            JOIN classes c ON ma.class_id = c.id
            JOIN academic_years ay ON c.academic_year_id = ay.id
            JOIN departments d ON ay.department_id = d.id
            WHERE ma.faculty_id = ? AND ma.status = 'active'
            ORDER BY c.class_name, c.section
        `, [facultyId]);

        if (classDetails.length > 0) {
            console.log('✅ Class details:');
            classDetails.forEach(cls => {
                console.log(`   - ${cls.class_name} Section ${cls.section}: ${cls.current_students}/${cls.max_students} students (${cls.dept_name})`);
            });
        } else {
            console.log('❌ No class details found!');
        }

        console.log('\n✅ ALL QUERIES TESTED SUCCESSFULLY!');

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the debug
debugFacultyFlow();