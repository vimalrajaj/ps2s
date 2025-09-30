// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  role: 'admin' | 'faculty' | 'student';
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'faculty' | 'student';
  created_at: string;
}

// Entity types
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  department_id: string;
  academic_year_id: string;
  semester: number;
  section: string;
  max_students: number;
  created_at: string;
  departments?: { name: string };
  academic_years?: { year: string };
}

export interface Faculty {
  id: string;
  email: string;
  name: string;
  phone: string;
  department_id: string;
  designation: string;
  specialization?: string;
  qualification?: string;
  experience_years: number;
  is_active: boolean;
  created_at: string;
  departments?: { name: string };
}

export interface Student {
  id: string;
  email: string;
  name: string;
  roll_number: string;
  phone: string;
  class_id: string;
  date_of_birth: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  admission_date: string;
  is_active: boolean;
  created_at: string;
  classes?: {
    name: string;
    semester: number;
    section: string;
    departments?: { name: string };
  };
}