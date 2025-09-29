const express = require('express');
const path = require('path');
const router = express.Router();

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

// Role-based middleware
function requireRole(roles) {
    return (req, res, next) => {
        console.log('🔍 Role check - User:', req.session?.user);
        console.log('🔍 Role check - Required roles:', roles);
        console.log('🔍 Role check - User type:', req.session?.user?.type);
        
        if (req.session && req.session.user && roles.includes(req.session.user.type)) {
            console.log('✅ Role check passed');
            return next();
        } else {
            console.log('❌ Role check failed - redirecting to login');
            return res.redirect('/login');
        }
    };
}

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login', 'index.html'));
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        // Check for admin login first
        if (username === 'admin' && password === 'admin123') {
            req.session.user = {
                id: 1,
                username: 'admin',
                name: 'Administrator',
                type: 'university'
            };
            
            console.log('✅ Admin login successful:', req.session.user);
            
            return res.json({
                success: true,
                message: 'University admin login successful',
                user: req.session.user,
                redirectUrl: '/university-portal/'
            });
        }

        // Check faculty table
        const [facultyResults] = await req.dbPool.execute(
            'SELECT * FROM faculty WHERE faculty_code = ? AND password = ? AND status = "active"',
            [username, password]
        );

        if (facultyResults.length > 0) {
            const faculty = facultyResults[0];
            
            // Set session
            req.session.user = {
                id: faculty.id,
                username: faculty.faculty_code,
                name: `${faculty.first_name} ${faculty.last_name}`,
                type: 'faculty',
                department: faculty.department,
                designation: faculty.designation
            };
            
            console.log('✅ Faculty login successful (legacy):', req.session.user);
            
            return res.json({
                success: true,
                message: 'Faculty login successful',
                user: req.session.user,
                redirectUrl: '/faculty-dashboard/'
            });
        }

        // Check students table for backward compatibility
        console.log('🔍 Checking student credentials:', username, password);
        const [studentResults] = await req.dbPool.execute(
            'SELECT * FROM students WHERE register_number = ? AND password = ?',
            [username, password]
        );
        
        console.log('🔍 Student query results:', studentResults.length, 'records found');

        if (studentResults.length > 0) {
            const student = studentResults[0];
            console.log('🔍 Student found:', student.first_name, student.last_name);
            
            // Set session
            req.session.user = {
                id: student.id,
                username: student.register_number,
                name: `${student.first_name} ${student.last_name}`,
                type: 'student',
                department: student.department,
                semester: student.current_semester
            };
            
            console.log('✅ Student login successful:', req.session.user);
            
            return res.json({
                success: true,
                message: 'Student login successful',
                user: req.session.user,
                redirectUrl: '/student-dashboard/'
            });
        }

        // No match found in any table
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Dashboard route handlers - serve appropriate pages after login with authentication
router.get('/university-portal', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'university_portal', 'index.html'));
});

router.get('/faculty-dashboard', requireAuth, requireRole(['faculty']), (req, res) => {
    console.log('✅ Faculty dashboard access - authenticated user:', req.session.user);
    res.sendFile(path.join(__dirname, '..', 'faculty_page', 'index.html'));
});

// Serve faculty dashboard static files (CSS, JS) for authenticated users
router.get('/faculty-dashboard/*', requireAuth, requireRole(['faculty']), (req, res) => {
    const filePath = req.params[0];
    const fullPath = path.join(__dirname, '..', 'faculty_page', filePath);
    
    // Check if file exists and serve it
    if (require('fs').existsSync(fullPath)) {
        res.sendFile(fullPath);
    } else {
        res.status(404).send('File not found');
    }
});

router.get('/student-dashboard', requireAuth, requireRole(['student']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'student_page', 'index.html'));
});

// Logout functionality - POST route for API calls
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Could not log out' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logged out successfully',
            redirectUrl: '/login'
        });
    });
});

// Logout functionality - GET route for direct navigation
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/login?error=logout_failed');
        }
        res.redirect('/login');
    });
});

// Check session status
router.get('/check-session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

// API route to get user profile
// Debug endpoint to check if student exists in database
router.get('/api/debug/student/:registerNumber', async (req, res) => {
    try {
        const registerNumber = req.params.registerNumber;
        console.log('🔍 Checking if student exists:', registerNumber);
        
        const [results] = await req.dbPool.execute(
            'SELECT * FROM students WHERE register_number = ?',
            [registerNumber]
        );
        
        console.log('🔍 Query results:', results.length, 'records found');
        
        res.json({
            success: true,
            exists: results.length > 0,
            count: results.length,
            student: results.length > 0 ? {
                id: results[0].id,
                name: `${results[0].first_name} ${results[0].last_name}`,
                register_number: results[0].register_number,
                password: results[0].password
            } : null
        });
    } catch (error) {
        console.error('Database check error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.get('/api/user-profile', (req, res) => {
    console.log('🔍 User Profile Request - Session:', req.session?.user);
    
    if (req.session && req.session.user) {
        res.json({
            success: true,
            user: req.session.user
        });
    } else {
        console.log('❌ No user session found');
        res.status(401).json({
            success: false,
            message: 'Not authenticated',
            user: null
        });
    }
});

module.exports = router;
