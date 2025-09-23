const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Load environment variables
require('dotenv').config();

// Import route modules
const initAuthRoutes = require('./routes/auth');
const initStudentRoutes = require('./routes/student');
const initFacultyRoutes = require('./routes/faculty');
const initCertificateRoutes = require('./routes/certificate');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'university_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create database connection pool
const dbPool = mysql.createPool(dbConfig);

// Simple session configuration without MySQL store for prototype
app.use(session({
  key: 'university_session',
  secret: 'your_session_secret_key_change_this_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 hours
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/student-page', express.static(path.join(__dirname, 'student_page')));
app.use('/faculty-page', express.static(path.join(__dirname, 'faculty_page')));
app.use('/certificate-verification', express.static(path.join(__dirname, 'certificate_verification', 'public')));

// Serve static files for dashboard pages
app.use('/student-dashboard', express.static(path.join(__dirname, 'student_page')));
app.use('/faculty-dashboard', express.static(path.join(__dirname, 'faculty_page')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    console.log('Authentication failed for:', req.url);
    return res.redirect('/login');
  }
}

// Role-based middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (req.session && req.session.user && roles.includes(req.session.user.userType)) {
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  };
}

// Database helper functions
async function getUserByUsername(username) {
  try {
    const [rows] = await dbPool.execute(
      'SELECT u.*, s.student_id, s.first_name as s_first_name, s.last_name as s_last_name, s.register_number, s.current_cgpa, s.profile_image as s_profile_image, f.faculty_id, f.first_name as f_first_name, f.last_name as f_last_name, f.employee_id, f.designation FROM users u LEFT JOIN students s ON u.user_id = s.user_id LEFT JOIN faculty f ON u.user_id = f.user_id WHERE u.username = ?',
      [username]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

async function updateLastLogin(userId) {
  try {
    await dbPool.execute(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

async function getStudentDashboardData(studentId) {
  try {
    const [studentData] = await dbPool.execute(`
      SELECT s.*, c.course_name, d.dept_name, u.email, u.last_login,
             COUNT(DISTINCT sc.cert_id) as total_certificates,
             COUNT(DISTINCT CASE WHEN sc.verification_status = 'Verified' THEN sc.cert_id END) as verified_certificates,
             AVG(CASE WHEN a.total_sessions > 0 THEN (a.attended_sessions / a.total_sessions * 100) END) as average_attendance
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN student_certificates sc ON s.student_id = sc.student_id
      LEFT JOIN attendance a ON s.student_id = a.student_id
      WHERE s.student_id = ?
      GROUP BY s.student_id
    `, [studentId]);

    // Get recent certificates
    const [certificates] = await dbPool.execute(`
      SELECT * FROM student_certificates 
      WHERE student_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [studentId]);

    // Get recent notifications
    const [notifications] = await dbPool.execute(`
      SELECT * FROM notifications 
      WHERE recipient_id = (SELECT user_id FROM students WHERE student_id = ?) 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [studentId]);

    // Get current semester performance
    const [performance] = await dbPool.execute(`
      SELECT * FROM academic_performance 
      WHERE student_id = ? AND semester = (SELECT semester FROM students WHERE student_id = ?)
      ORDER BY subject_name
    `, [studentId, studentId]);

    return {
      student: studentData[0],
      certificates,
      notifications,
      performance
    };
  } catch (error) {
    console.error('Error getting student dashboard data:', error);
    return null;
  }
}

// Initialize routes with dependencies
const dbHelpers = {
  dbPool,
  getUserByUsername,
  updateLastLogin,
  getStudentDashboardData
};

const middlewares = {
  requireAuth,
  requireRole
};

// Initialize and use route modules
const authRoutes = initAuthRoutes(dbHelpers, middlewares);
const studentRoutes = initStudentRoutes(dbHelpers, middlewares);
const facultyRoutes = initFacultyRoutes(dbHelpers, middlewares);
const certificateRoutes = initCertificateRoutes();

// Use routes
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', facultyRoutes);
app.use('/', certificateRoutes);

// Check database connection
(async function checkDatabaseConnection() {
  try {
    const connection = await dbPool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Prevent server crash by always sending a response
  if (!res.headersSent) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Internal Server Error',
      details: 'An unexpected error occurred during certificate verification'
    });
  }
  
  // Don't crash the server
  console.log('Error handled gracefully, server continuing...');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Note: System supports both QR codes and text URL extraction via OCR.');
});