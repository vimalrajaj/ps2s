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
        if (req.session && req.session.user && roles.includes(req.session.user.type)) {
            return next();
        } else {
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

        // Check admin table for university login
        const [adminResults] = await req.dbPool.execute(
            'SELECT * FROM admin WHERE username = ? AND password = ?',
            [username, password]
        );

        if (adminResults.length > 0) {
            const user = adminResults[0];
            
            // Set session
            req.session.user = {
                id: user.id,
                username: user.username,
                type: 'university'
            };
            
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
            
            return res.json({
                success: true,
                message: 'Faculty login successful',
                user: req.session.user,
                redirectUrl: '/faculty-dashboard/'
            });
        }

        // Check students table
        const [studentResults] = await req.dbPool.execute(
            'SELECT * FROM students WHERE register_number = ? AND password = ?',
            [username, password]
        );

        if (studentResults.length > 0) {
            const student = studentResults[0];
            
            // Set session
            req.session.user = {
                id: student.id,
                username: student.register_number,
                name: `${student.first_name} ${student.last_name}`,
                type: 'student',
                department: student.department,
                semester: student.current_semester
            };
            
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
router.get('/university-portal', requireAuth, requireRole(['university']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'university_portal', 'index.html'));
});

router.get('/faculty-dashboard', requireAuth, requireRole(['faculty']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'faculty_page', 'index.html'));
});

router.get('/student-dashboard', requireAuth, requireRole(['student']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'student_page', 'index.html'));
});

// Logout functionality
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
router.get('/api/user-profile', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

module.exports = router;
