import { apiClient } from '../services/api';
import type { Department, AcademicYear, Class, Faculty, Student, PaginatedResponse } from '../types';

// Departments API
export const departmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse<Department>>(`/admin/departments?${query}`);
    return response.data!;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Department>(`/admin/departments/${id}`);
    return response.data!;
  },

  create: async (data: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await apiClient.post<Department>('/admin/departments', data);
    return response.data!;
  },

  update: async (id: string, data: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at'>>) => {
    const response = await apiClient.put<Department>(`/admin/departments/${id}`, data);
    return response.data!;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/admin/departments/${id}`);
  },

  getStats: async () => {
    const response = await apiClient.get('/admin/departments/stats');
    return response.data!;
  },
};

// Academic Years API
export const academicYearsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse<AcademicYear>>(`/admin/academic-years?${query}`);
    return response.data!;
  },
};

// Classes API
export const classesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse<Class>>(`/admin/classes?${query}`);
    return response.data!;
  },
};

// Faculty API
export const facultyApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse<Faculty>>(`/admin/faculty?${query}`);
    return response.data!;
  },
};

// Students API
export const studentsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse<Student>>(`/admin/students?${query}`);
    return response.data!;
  },
};