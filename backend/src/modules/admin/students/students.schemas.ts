import { z } from 'zod';

export const createStudentSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  roll_number: z.string().min(1, 'Roll number is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  class_id: z.string().uuid('Invalid class ID'),
  date_of_birth: z.string().datetime('Invalid date of birth'),
  address: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  admission_date: z.string().datetime('Invalid admission date'),
  is_active: z.boolean().default(true),
});

export const updateStudentSchema = createStudentSchema.omit({ password: true }).partial();

export const studentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  class_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  is_active: z.coerce.boolean().optional(),
});

export type CreateStudent = z.infer<typeof createStudentSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;