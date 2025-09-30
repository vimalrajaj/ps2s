import { Router } from 'express';
import { asyncHandler } from '../../../middleware/error-handler.js';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { StudentsController } from './students.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes (accessible by all authenticated users)
router.get('/', asyncHandler(StudentsController.getStudents));
router.get('/stats', asyncHandler(StudentsController.getStudentStats));
router.get('/:id', asyncHandler(StudentsController.getStudentById));

// Admin-only routes
router.post('/', requireRole('admin'), asyncHandler(StudentsController.createStudent));
router.put('/:id', requireRole('admin'), asyncHandler(StudentsController.updateStudent));
router.delete('/:id', requireRole('admin'), asyncHandler(StudentsController.deleteStudent));

export default router;