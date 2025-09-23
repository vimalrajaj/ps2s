const express = require('express');
const path = require('path');
const router = express.Router();

// Import database helper functions (these will be passed as dependencies)
let getUserByUsername, updateLastLogin;

// Initialize the route with dependencies
function initAuthRoutes(dbHelpers, middlewares) {
  getUserByUsername = dbHelpers.getUserByUsername;
  updateLastLogin = dbHelpers.updateLastLogin;
  
  const { requireAuth, requireRole } = middlewares;

  // Home route - redirect to login
  router.get('/', (req, res) => {
    res.redirect('/login');
  });

  // Login page route
  router.get('/login', (req, res) => {
    // Always serve the login page and let client-side handle session checks
    // This prevents server-side redirect loops
    res.sendFile(path.join(__dirname, '..', 'login', 'index.html'));
  });

  // Authentication route
  router.post('/login', async (req, res) => {
    try {
      const { username, password, userType, rememberMe } = req.body;

      if (!username || !password || !userType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password, and user type are required' 
        });
      }

      const user = await getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }

      // Check if user type matches
      if (user.user_type !== userType) {
        return res.status(401).json({ 
          success: false, 
          message: `Invalid credentials for ${userType} login` 
        });
      }

      // Check account status - make this more flexible
      if (user.status && user.status !== 'active') {
        return res.status(401).json({ 
          success: false, 
          message: 'Account is inactive or suspended' 
        });
      }

      // Verify password - simple text comparison for prototype
      const passwordMatch = (password === user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }

      // Update last login
      await updateLastLogin(user.user_id);

      // Create session
      const userData = {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        userType: user.user_type,
        firstName: user.s_first_name || user.f_first_name,
        lastName: user.s_last_name || user.f_last_name,
        profileImage: user.s_profile_image,
        studentId: user.student_id,
        facultyId: user.faculty_id,
        registerNumber: user.register_number,
        employeeId: user.employee_id,
        cgpa: user.current_cgpa,
        designation: user.designation
      };

      req.session.user = userData;
      
      console.log('Session created for user:', {
        userId: userData.userId,
        username: userData.username,
        userType: userData.userType,
        sessionId: req.sessionID
      });

      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      // Determine redirect URL based on user type
      const redirectUrl = userData.userType === 'student' ? '/student-dashboard' : '/faculty-dashboard';

      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, message: 'Session save failed' });
        }
        
        console.log('Session saved successfully, sending response');
        res.json({
          success: true,
          message: 'Login successful',
          user: userData,
          redirectUrl: redirectUrl
        });
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });

  // Check session route
  router.get('/check-session', (req, res) => {
    if (req.session && req.session.user) {
      res.json({
        authenticated: true,
        user: req.session.user
      });
    } else {
      res.json({
        authenticated: false
      });
    }
  });

  // Logout route
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Protected dashboard routes
  router.get('/student-dashboard', requireAuth, requireRole(['student']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'student_page', 'index.html'));
  });

  router.get('/faculty-dashboard', requireAuth, requireRole(['faculty', 'admin']), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'faculty_page', 'index.html'));
  });

  return router;
}

module.exports = initAuthRoutes;