import { Router } from 'express';
import { asyncHandler } from '../../../middleware/error-handler.js';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { AcademicYearsController } from './academic-years.controller.js';
const router = Router();
// All routes require authentication
router.use(requireAuth);
// GET routes (accessible by all authenticated users)
router.get('/', asyncHandler(AcademicYearsController.getAcademicYears));
router.get('/stats', asyncHandler(AcademicYearsController.getAcademicYearStats));
router.get('/:id', asyncHandler(AcademicYearsController.getAcademicYearById));
// Admin-only routes
router.post('/', requireRole('admin'), asyncHandler(AcademicYearsController.createAcademicYear));
router.put('/:id', requireRole('admin'), asyncHandler(AcademicYearsController.updateAcademicYear));
router.delete('/:id', requireRole('admin'), asyncHandler(AcademicYearsController.deleteAcademicYear));
export default router;
