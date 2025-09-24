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
const session = require('express-session');

// Load environment variables
require('dotenv').config();

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

// Basic database connection test
async function testDatabaseConnection() {
  try {
    const connection = await dbPool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Test database connection on startup
testDatabaseConnection();

// Session configuration
app.use(session({
  secret: 'university_session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve static files for different pages
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/student-page', express.static(path.join(__dirname, 'student_page')));
app.use('/faculty-page', express.static(path.join(__dirname, 'faculty_page')));
app.use('/certificate-verification', express.static(path.join(__dirname, 'certificate_verification', 'public')));
app.use('/university-portal', express.static(path.join(__dirname, 'university_portal')));

// Serve static files for dashboard pages
app.use('/student-dashboard', express.static(path.join(__dirname, 'student_page')));
app.use('/faculty-dashboard', express.static(path.join(__dirname, 'faculty_page')));
app.use('/admin-dashboard', express.static(path.join(__dirname, 'university_portal')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Import and use route modules
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');

// Use routes with database connection
app.use('/', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, authRoutes);

app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, studentRoutes);

app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, facultyRoutes);

// TODO: Add your API routes here
// Example:
// app.post('/api/create-student', (req, res) => {
//   // Your logic here
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: err.message 
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Note: System supports both QR codes and text URL extraction via OCR.');
});

// Export for testing
module.exports = { app, dbPool };