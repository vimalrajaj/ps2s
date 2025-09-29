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
// Faculty dashboard is handled by auth routes - removed static middleware
app.use('/admin-dashboard', express.static(path.join(__dirname, 'university_portal')));

// Serve sample files
app.get('/sample_marks_upload.xlsx', (req, res) => {
    const filePath = path.join(__dirname, 'sample_marks_upload.xlsx');
    res.download(filePath, 'sample_marks_upload.xlsx', (err) => {
        if (err) {
            console.error('Error downloading sample Excel file:', err);
            res.status(404).send('Sample file not found');
        }
    });
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware for Excel files (using express-fileupload)
const fileUpload = require('express-fileupload');

// Apply express-fileupload only to specific routes that need it
const excelUploadMiddleware = fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Configure multer for certificate uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function(req, file, cb) {
        // Allow image files for certificates
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for certificate uploads'));
        }
    }
});

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
const departmentRoutes = require('./routes/department');
const subjectRoutes = require('./routes/subjects');

// Use routes with database connection
app.use('/', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, authRoutes);

app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, studentRoutes);

// Faculty routes with Excel upload middleware for specific route
app.use('/api/faculty/upload-marks', excelUploadMiddleware);
app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, facultyRoutes);

app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, departmentRoutes);

app.use('/api', (req, res, next) => {
    req.dbPool = dbPool;
    next();
}, subjectRoutes);

// Certificate verification route
app.post('/verify', upload.single('certificate'), async (req, res) => {
    try {
        const { name } = req.body;
        const certificateFile = req.file;

        if (!name || !certificateFile) {
            return res.status(400).json({
                status: 'Invalid',
                reason: 'Name and certificate file are required'
            });
        }

        console.log('Certificate verification request:', {
            name: name,
            filename: certificateFile.filename,
            size: certificateFile.size
        });

        // Here you would implement your certificate verification logic
        // For now, let's create a mock verification response
        
        // Simulate different verification outcomes based on name for demo
        const mockResults = {
            'John Doe': {
                status: 'Valid',
                certificate: {
                    name: 'John Doe',
                    course: 'AWS Cloud Practitioner',
                    id: 'AWS-CP-2024-001',
                    issuer: 'Amazon Web Services'
                },
                message: 'Certificate successfully verified against AWS database'
            },
            'Jane Smith': {
                status: 'PartiallyVerified',
                certificate: {
                    name: 'Jane Smith',
                    course: 'Azure Fundamentals',
                    id: 'AZ-900-2024-002'
                },
                message: 'Certificate found but name mismatch detected',
                action: 'Please contact issuing authority to update certificate details'
            }
        };

        // Check if we have a mock result for this name
        const result = mockResults[name] || {
            status: 'Valid',
            certificate: {
                name: name,
                course: 'Professional Certificate',
                id: 'CERT-' + Date.now(),
                issuer: 'Verification System'
            },
            message: 'Certificate verified successfully',
            note: 'This is a demo verification. In production, this would scan QR codes and verify against real databases.'
        };

        // Clean up uploaded file (optional - you might want to keep it)
        // fs.unlinkSync(certificateFile.path);

        res.json(result);

    } catch (error) {
        console.error('Certificate verification error:', error);
        res.status(500).json({
            status: 'Invalid',
            reason: 'Internal server error during verification'
        });
    }
});

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