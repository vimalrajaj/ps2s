import { z } from 'zod';
export const createDepartmentSchema = z.object({
    dept_name: z.string().min(1, 'Department name is required').max(100),
    dept_code: z.string().min(1, 'Department code is required').max(10).toUpperCase(),
    description: z.string().max(500).optional(),
    head_of_department: z.string().max(100).optional(),
});
export const updateDepartmentSchema = z.object({
    dept_name: z.string().min(1).max(100).optional(),
    dept_code: z.string().min(1).max(10).toUpperCase().optional(),
    description: z.string().max(500).optional(),
    head_of_department: z.string().max(100).optional(),
});
export const departmentQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['dept_name', 'dept_code', 'created_at']).default('dept_name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
