// API configuration
export const API_BASE_URL = 'http://localhost:4000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',
  
  // Admin endpoints
  DEPARTMENTS: '/admin/departments',
  ACADEMIC_YEARS: '/admin/academic-years',
  CLASSES: '/admin/classes',
  FACULTY: '/admin/faculty',
  STUDENTS: '/admin/students',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;