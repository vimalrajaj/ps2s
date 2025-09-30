import { Router } from 'express';
import { asyncHandler } from '../../../middleware/error-handler.js';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { FacultyController } from './faculty.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes (accessible by all authenticated users)
router.get('/', asyncHandler(FacultyController.getFaculty));
router.get('/stats', asyncHandler(FacultyController.getFacultyStats));
router.get('/:id', asyncHandler(FacultyController.getFacultyById));

// Admin-only routes
router.post('/', requireRole('admin'), asyncHandler(FacultyController.createFaculty));
router.put('/:id', requireRole('admin'), asyncHandler(FacultyController.updateFaculty));
router.delete('/:id', requireRole('admin'), asyncHandler(FacultyController.deleteFaculty));

export default router;