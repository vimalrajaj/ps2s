import { Router } from 'express';
import { asyncHandler } from '../../../middleware/error-handler.js';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { ClassesController } from './classes.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes (accessible by all authenticated users)
router.get('/', asyncHandler(ClassesController.getClasses));
router.get('/stats', asyncHandler(ClassesController.getClassStats));
router.get('/:id', asyncHandler(ClassesController.getClassById));

// Admin-only routes
router.post('/', requireRole('admin'), asyncHandler(ClassesController.createClass));
router.put('/:id', requireRole('admin'), asyncHandler(ClassesController.updateClass));
router.delete('/:id', requireRole('admin'), asyncHandler(ClassesController.deleteClass));

export default router;