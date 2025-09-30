import { z } from 'zod';
export const createClassSchema = z.object({
    name: z.string().min(1, 'Class name is required'),
    department_id: z.string().uuid('Invalid department ID'),
    academic_year_id: z.string().uuid('Invalid academic year ID'),
    semester: z.number().min(1).max(8, 'Semester must be between 1 and 8'),
    section: z.string().min(1, 'Section is required'),
    max_students: z.number().min(1, 'Max students must be at least 1').default(60),
});
export const updateClassSchema = createClassSchema.partial();
export const classQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    department_id: z.string().uuid().optional(),
    academic_year_id: z.string().uuid().optional(),
    semester: z.coerce.number().min(1).max(8).optional(),
});
