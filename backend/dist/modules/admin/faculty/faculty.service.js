import bcrypt from 'bcrypt';
import { supabase } from '../../../config/supabase.js';
import { HttpError } from '../../../middleware/error-handler.js';
export class FacultyService {
    static async createFaculty(data) {
        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const { data: faculty, error } = await supabase
            .from('faculty')
            .insert({
            ...data,
            password: hashedPassword,
        })
            .select(`
        *,
        departments:department_id (name)
      `)
            .single();
        if (error) {
            throw new HttpError(400, `Failed to create faculty: ${error.message}`);
        }
        // Remove password from response
        const { password, ...facultyWithoutPassword } = faculty;
        return facultyWithoutPassword;
    }
    static async getFaculty(query) {
        const { page, limit, search, department_id, designation, is_active } = query;
        const offset = (page - 1) * limit;
        let dbQuery = supabase
            .from('faculty')
            .select(`
        id, email, name, phone, department_id, designation, 
        specialization, qualification, experience_years, is_active, created_at,
        departments:department_id (name)
      `, { count: 'exact' })
            .order('name');
        if (search) {
            dbQuery = dbQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,designation.ilike.%${search}%`);
        }
        if (department_id) {
            dbQuery = dbQuery.eq('department_id', department_id);
        }
        if (designation) {
            dbQuery = dbQuery.ilike('designation', `%${designation}%`);
        }
        if (is_active !== undefined) {
            dbQuery = dbQuery.eq('is_active', is_active);
        }
        const { data: faculty, error, count } = await dbQuery
            .range(offset, offset + limit - 1);
        if (error) {
            throw new HttpError(400, `Failed to fetch faculty: ${error.message}`);
        }
        return {
            data: faculty || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    }
    static async getFacultyById(id) {
        const { data: faculty, error } = await supabase
            .from('faculty')
            .select(`
        id, email, name, phone, department_id, designation, 
        specialization, qualification, experience_years, is_active, created_at,
        departments:department_id (name)
      `)
            .eq('id', id)
            .single();
        if (error) {
            throw new HttpError(404, 'Faculty not found');
        }
        return faculty;
    }
    static async updateFaculty(id, data) {
        const { data: faculty, error } = await supabase
            .from('faculty')
            .update(data)
            .eq('id', id)
            .select(`
        id, email, name, phone, department_id, designation, 
        specialization, qualification, experience_years, is_active, created_at,
        departments:department_id (name)
      `)
            .single();
        if (error) {
            throw new HttpError(400, `Failed to update faculty: ${error.message}`);
        }
        return faculty;
    }
    static async deleteFaculty(id) {
        const { error } = await supabase
            .from('faculty')
            .delete()
            .eq('id', id);
        if (error) {
            throw new HttpError(400, `Failed to delete faculty: ${error.message}`);
        }
        return { message: 'Faculty deleted successfully' };
    }
    static async getFacultyStats() {
        const { data: stats, error } = await supabase
            .from('faculty')
            .select(`
        id, is_active, experience_years,
        departments!inner (name)
      `);
        if (error) {
            throw new HttpError(400, `Failed to fetch faculty stats: ${error.message}`);
        }
        const total = stats?.length || 0;
        const active = stats?.filter(f => f.is_active).length || 0;
        const avgExperience = stats?.reduce((sum, f) => sum + f.experience_years, 0) / total || 0;
        const departmentCounts = stats?.reduce((acc, f) => {
            const deptName = f.departments?.name || 'Unknown';
            acc[deptName] = (acc[deptName] || 0) + 1;
            return acc;
        }, {}) || {};
        return {
            total,
            active,
            inactive: total - active,
            averageExperience: Math.round(avgExperience * 10) / 10,
            byDepartment: departmentCounts,
        };
    }
}
