import { supabase } from '../../../config/supabase.js';
import { HttpError } from '../../../middleware/error-handler.js';
import { logger } from '../../../utils/logger.js';
class DepartmentsService {
    async createDepartment(data) {
        try {
            // Check if department code already exists
            const { data: existing, error: checkError } = await supabase
                .from('departments')
                .select('id')
                .eq('dept_code', data.dept_code)
                .single();
            if (existing && !checkError) {
                throw new HttpError(400, 'Department code already exists');
            }
            const { data: department, error } = await supabase
                .from('departments')
                .insert([data])
                .select()
                .single();
            if (error) {
                logger.error({ error, data }, 'Failed to create department');
                throw new HttpError(500, 'Failed to create department');
            }
            logger.info({ departmentId: department.id, dept_code: department.dept_code }, 'Department created');
            return department;
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error, data }, 'Create department error');
            throw new HttpError(500, 'Failed to create department');
        }
    }
    async getDepartments(params) {
        try {
            let query = supabase.from('departments').select('*', { count: 'exact' });
            // Apply search filter
            if (params.search) {
                query = query.or(`dept_name.ilike.%${params.search}%,dept_code.ilike.%${params.search}%`);
            }
            // Apply sorting
            query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
            // Apply pagination
            const offset = (params.page - 1) * params.limit;
            query = query.range(offset, offset + params.limit - 1);
            const { data: departments, error, count } = await query;
            if (error) {
                logger.error({ error, params }, 'Failed to fetch departments');
                throw new HttpError(500, 'Failed to fetch departments');
            }
            const total = count || 0;
            const totalPages = Math.ceil(total / params.limit);
            return {
                data: departments || [],
                total,
                page: params.page,
                limit: params.limit,
                totalPages,
            };
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error, params }, 'Get departments error');
            throw new HttpError(500, 'Failed to fetch departments');
        }
    }
    async getDepartmentById(id) {
        try {
            const { data: department, error } = await supabase
                .from('departments')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger.error({ error, id }, 'Failed to fetch department');
                throw new HttpError(500, 'Failed to fetch department');
            }
            return department;
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error, id }, 'Get department by ID error');
            throw new HttpError(500, 'Failed to fetch department');
        }
    }
    async updateDepartment(id, data) {
        try {
            // Check if department exists
            const existing = await this.getDepartmentById(id);
            if (!existing) {
                throw new HttpError(404, 'Department not found');
            }
            // Check if dept_code is being updated and already exists
            if (data.dept_code && data.dept_code !== existing.dept_code) {
                const { data: duplicateCheck, error: checkError } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('dept_code', data.dept_code)
                    .neq('id', id)
                    .single();
                if (duplicateCheck && !checkError) {
                    throw new HttpError(400, 'Department code already exists');
                }
            }
            const { data: department, error } = await supabase
                .from('departments')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                logger.error({ error, id, data }, 'Failed to update department');
                throw new HttpError(500, 'Failed to update department');
            }
            logger.info({ departmentId: id, changes: data }, 'Department updated');
            return department;
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error, id, data }, 'Update department error');
            throw new HttpError(500, 'Failed to update department');
        }
    }
    async deleteDepartment(id) {
        try {
            // Check if department exists
            const existing = await this.getDepartmentById(id);
            if (!existing) {
                throw new HttpError(404, 'Department not found');
            }
            // Check for dependent records
            const { data: facultyCount, error: facultyError } = await supabase
                .from('faculty')
                .select('id', { count: 'exact' })
                .eq('department', id);
            if (facultyError) {
                logger.error({ error: facultyError, id }, 'Failed to check faculty dependencies');
                throw new HttpError(500, 'Failed to check dependencies');
            }
            const { data: classesCount, error: classesError } = await supabase
                .from('classes')
                .select('id', { count: 'exact' })
                .eq('department_id', id);
            if (classesError) {
                logger.error({ error: classesError, id }, 'Failed to check classes dependencies');
                throw new HttpError(500, 'Failed to check dependencies');
            }
            if ((facultyCount?.length || 0) > 0 || (classesCount?.length || 0) > 0) {
                throw new HttpError(400, 'Cannot delete department with existing faculty or classes');
            }
            const { error } = await supabase
                .from('departments')
                .delete()
                .eq('id', id);
            if (error) {
                logger.error({ error, id }, 'Failed to delete department');
                throw new HttpError(500, 'Failed to delete department');
            }
            logger.info({ departmentId: id }, 'Department deleted');
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error, id }, 'Delete department error');
            throw new HttpError(500, 'Failed to delete department');
        }
    }
    async getDepartmentStats() {
        try {
            // Get total counts
            const [{ count: totalDepartments }, { count: totalFaculty }, { count: totalStudents }] = await Promise.all([
                supabase.from('departments').select('*', { count: 'exact', head: true }),
                supabase.from('faculty').select('*', { count: 'exact', head: true }),
                supabase.from('students').select('*', { count: 'exact', head: true })
            ]);
            // Get department breakdown
            const { data: departments, error } = await supabase
                .from('departments')
                .select(`
          dept_name,
          dept_code,
          faculty:faculty(count),
          classes:classes(
            students:students(count)
          )
        `);
            if (error) {
                logger.error({ error }, 'Failed to fetch department stats');
                throw new HttpError(500, 'Failed to fetch department stats');
            }
            const departmentBreakdown = (departments || []).map((dept) => ({
                dept_name: dept.dept_name,
                dept_code: dept.dept_code,
                faculty_count: dept.faculty?.length || 0,
                student_count: dept.classes?.reduce((total, cls) => total + (cls.students?.length || 0), 0) || 0,
            }));
            return {
                totalDepartments: totalDepartments || 0,
                totalFaculty: totalFaculty || 0,
                totalStudents: totalStudents || 0,
                departmentBreakdown,
            };
        }
        catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error({ error }, 'Get department stats error');
            throw new HttpError(500, 'Failed to fetch department stats');
        }
    }
}
export const departmentsService = new DepartmentsService();
