const express = require('express');
const router = express.Router();

// Import database helper functions (these will be passed as dependencies)
let getStudentDashboardData;

// Initialize the route with dependencies
function initStudentRoutes(dbHelpers, middlewares) {
  getStudentDashboardData = dbHelpers.getStudentDashboardData;
  
  const { requireAuth, requireRole } = middlewares;

  // Get student dashboard data
  router.get('/api/student-data', requireAuth, requireRole(['student']), async (req, res) => {
    try {
      const studentData = await getStudentDashboardData(req.session.user.studentId);
      
      if (!studentData) {
        return res.status(404).json({ message: 'Student data not found' });
      }

      res.json(studentData);
    } catch (error) {
      console.error('Error fetching student data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user profile (available for both students and faculty)
  router.get('/api/user-profile', requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      res.json({
        success: true,
        user: user
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = initStudentRoutes;