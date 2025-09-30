import { z } from 'zod';

export const createFacultySchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  department_id: z.string().uuid('Invalid department ID'),
  designation: z.string().min(1, 'Designation is required'),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience_years: z.number().min(0, 'Experience years cannot be negative').default(0),
  is_active: z.boolean().default(true),
});

export const updateFacultySchema = createFacultySchema.omit({ password: true }).partial();

export const facultyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  department_id: z.string().uuid().optional(),
  designation: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export type CreateFaculty = z.infer<typeof createFacultySchema>;
export type UpdateFaculty = z.infer<typeof updateFacultySchema>;
export type FacultyQuery = z.infer<typeof facultyQuerySchema>;