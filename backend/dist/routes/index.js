import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.router.js';
import { departmentsRouter } from '../modules/admin/departments/departments.router.js';
import academicYearsRouter from '../modules/admin/academic-years/academic-years.router.js';
import classesRouter from '../modules/admin/classes/classes.router.js';
import facultyRouter from '../modules/admin/faculty/faculty.router.js';
import studentsRouter from '../modules/admin/students/students.router.js';
import { healthRouter } from '../modules/health/health.router.js';
export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/health', healthRouter);
// Admin routes
apiRouter.use('/admin/departments', departmentsRouter);
apiRouter.use('/admin/academic-years', academicYearsRouter);
apiRouter.use('/admin/classes', classesRouter);
apiRouter.use('/admin/faculty', facultyRouter);
apiRouter.use('/admin/students', studentsRouter);
