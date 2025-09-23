const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Import database helper functions (these will be passed as dependencies)
let dbPool, getStudentDashboardData;

// Initialize the route with dependencies
function initFacultyRoutes(dbHelpers, middlewares) {
  dbPool = dbHelpers.dbPool;
  getStudentDashboardData = dbHelpers.getStudentDashboardData;
  
  const { requireAuth, requireRole } = middlewares;

  // Faculty dashboard statistics
  router.get('/api/faculty/dashboard-stats', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const [stats] = await dbPool.execute(`
        SELECT 
          COUNT(DISTINCT s.student_id) as totalStudents,
          COUNT(DISTINCT sc.cert_id) as totalCertificates,
          COUNT(DISTINCT CASE WHEN sc.verification_status = 'Pending' THEN sc.cert_id END) as pendingVerifications,
          AVG(s.current_cgpa) as averageCGPA
        FROM students s
        LEFT JOIN student_certificates sc ON s.student_id = sc.student_id
        WHERE s.enrollment_status = 'Active'
      `);

      res.json(stats[0] || {});
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Recent activities
  router.get('/api/faculty/recent-activities', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const [activities] = await dbPool.execute(`
        SELECT 
          CONCAT(s.first_name, ' ', s.last_name) as name,
          s.register_number,
          u.email,
          c.course_name as course,
          s.current_cgpa as cgpa,
          s.enrollment_status as status,
          GREATEST(u.last_login, s.updated_at) as last_activity
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.enrollment_status = 'Active'
        ORDER BY last_activity DESC
        LIMIT 10
      `);

      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all students
  router.get('/api/faculty/students', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const [students] = await dbPool.execute(`
        SELECT 
          s.*,
          u.email,
          u.status as user_status,
          c.course_name,
          d.dept_name
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN departments d ON c.dept_id = d.dept_id
        ORDER BY s.first_name, s.last_name
      `);

      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all certificates
  router.get('/api/faculty/certificates', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const [certificates] = await dbPool.execute(`
        SELECT 
          sc.*,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          s.register_number
        FROM student_certificates sc
        JOIN students s ON sc.student_id = s.student_id
        ORDER BY sc.created_at DESC
      `);

      res.json(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all courses
  router.get('/api/faculty/courses', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const [courses] = await dbPool.execute(`
        SELECT c.*, d.dept_name 
        FROM courses c
        LEFT JOIN departments d ON c.dept_id = d.dept_id
        WHERE c.status = 'Active'
        ORDER BY d.dept_name, c.course_name
      `);

      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get specific student details
  router.get('/api/faculty/student/:id', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const studentId = req.params.id;
      const studentData = await getStudentDashboardData(studentId);
      
      if (!studentData) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(studentData.student);
    } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create new student
  router.post('/api/faculty/create-student', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const {
        registerNumber,
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        phone,
        course,
        batchYear,
        defaultPassword
      } = req.body;

      // Validate required fields
      if (!registerNumber || !firstName || !lastName || !email || !dateOfBirth || !gender || !course || !batchYear) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Check if register number or email already exists
      const [existing] = await dbPool.execute(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [registerNumber, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Register number or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(defaultPassword || 'student123', 10);

      // Call stored procedure to create student account
      await dbPool.execute(
        'CALL CreateStudentAccount(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [registerNumber, hashedPassword, firstName, lastName, email, course, batchYear, dateOfBirth, gender, phone]
      );

      res.json({ success: true, message: 'Student account created successfully' });
    } catch (error) {
      console.error('Error creating student:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Register number or email already exists' });
      } else {
        res.status(500).json({ message: 'Error creating student account' });
      }
    }
  });

  // Verify certificate
  router.post('/api/faculty/verify-certificate/:id', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const certId = req.params.id;
      const facultyId = req.session.user.facultyId;

      await dbPool.execute(`
        UPDATE student_certificates 
        SET verification_status = 'Verified', 
            verified_by = ?, 
            verification_date = NOW(),
            verification_notes = 'Verified by faculty'
        WHERE cert_id = ?
      `, [facultyId, certId]);

      res.json({ success: true, message: 'Certificate verified successfully' });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({ message: 'Error verifying certificate' });
    }
  });

  // Generate reports
  router.get('/api/faculty/reports', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      // Department statistics
      const [deptStats] = await dbPool.execute(`
        SELECT d.dept_name, COUNT(s.student_id) as student_count
        FROM departments d
        LEFT JOIN courses c ON d.dept_id = c.dept_id
        LEFT JOIN students s ON c.course_id = s.course_id
        WHERE s.enrollment_status = 'Active'
        GROUP BY d.dept_id, d.dept_name
        ORDER BY student_count DESC
      `);

      // CGPA distribution
      const [cgpaStats] = await dbPool.execute(`
        SELECT 
          CASE 
            WHEN current_cgpa >= 9.0 THEN 'Excellent (9.0+)'
            WHEN current_cgpa >= 8.0 THEN 'Very Good (8.0-8.9)'
            WHEN current_cgpa >= 7.0 THEN 'Good (7.0-7.9)'
            WHEN current_cgpa >= 6.0 THEN 'Average (6.0-6.9)'
            ELSE 'Below Average (<6.0)'
          END as cgpa_range,
          COUNT(*) as count
        FROM students 
        WHERE enrollment_status = 'Active'
        GROUP BY cgpa_range
        ORDER BY MIN(current_cgpa) DESC
      `);

      // Certificate analytics
      const [certStats] = await dbPool.execute(`
        SELECT verification_status, COUNT(*) as count
        FROM student_certificates
        GROUP BY verification_status
      `);

      const reports = {
        departmentStats: deptStats,
        cgpaDistribution: Object.fromEntries(cgpaStats.map(stat => [stat.cgpa_range, stat.count])),
        certificateAnalytics: Object.fromEntries(certStats.map(stat => [stat.verification_status, stat.count]))
      };

      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = initFacultyRoutes;