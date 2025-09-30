import { z } from 'zod';
export const createAcademicYearSchema = z.object({
    year: z.string().min(1, 'Year is required'),
    start_date: z.string().datetime('Invalid start date'),
    end_date: z.string().datetime('Invalid end date'),
    is_current: z.boolean().default(false),
});
export const updateAcademicYearSchema = createAcademicYearSchema.partial();
export const academicYearQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    is_current: z.coerce.boolean().optional(),
});
