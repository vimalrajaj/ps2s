import { Router } from 'express';
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment, getDepartmentStats } from './departments.controller.js';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
export const departmentsRouter = Router();
// Apply auth middleware to all routes
departmentsRouter.use(requireAuth);
// Public routes (accessible to all authenticated users)
departmentsRouter.get('/', getDepartments);
departmentsRouter.get('/stats', getDepartmentStats);
departmentsRouter.get('/:id', getDepartmentById);
// Admin-only routes
departmentsRouter.post('/', requireRole('admin'), createDepartment);
departmentsRouter.put('/:id', requireRole('admin'), updateDepartment);
departmentsRouter.delete('/:id', requireRole('admin'), deleteDepartment);
