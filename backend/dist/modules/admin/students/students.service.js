import bcrypt from 'bcrypt';
import { supabase } from '../../../config/supabase.js';
import { HttpError } from '../../../middleware/error-handler.js';
export class StudentsService {
    static async createStudent(data) {
        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const { data: student, error } = await supabase
            .from('students')
            .insert({
            ...data,
            password: hashedPassword,
        })
            .select(`
        *,
        classes:class_id (
          name, semester, section,
          departments:department_id (name)
        )
      `)
            .single();
        if (error) {
            throw new HttpError(400, `Failed to create student: ${error.message}`);
        }
        // Remove password from response
        const { password, ...studentWithoutPassword } = student;
        return studentWithoutPassword;
    }
    static async getStudents(query) {
        const { page, limit, search, class_id, department_id, is_active } = query;
        const offset = (page - 1) * limit;
        let dbQuery = supabase
            .from('students')
            .select(`
        id, email, name, roll_number, phone, class_id, date_of_birth,
        address, guardian_name, guardian_phone, admission_date, is_active, created_at,
        classes:class_id (
          name, semester, section,
          departments:department_id (name)
        )
      `, { count: 'exact' })
            .order('name');
        if (search) {
            dbQuery = dbQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`);
        }
        if (class_id) {
            dbQuery = dbQuery.eq('class_id', class_id);
        }
        if (department_id) {
            dbQuery = dbQuery.eq('classes.department_id', department_id);
        }
        if (is_active !== undefined) {
            dbQuery = dbQuery.eq('is_active', is_active);
        }
        const { data: students, error, count } = await dbQuery
            .range(offset, offset + limit - 1);
        if (error) {
            throw new HttpError(400, `Failed to fetch students: ${error.message}`);
        }
        return {
            data: students || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    }
    static async getStudentById(id) {
        const { data: student, error } = await supabase
            .from('students')
            .select(`
        id, email, name, roll_number, phone, class_id, date_of_birth,
        address, guardian_name, guardian_phone, admission_date, is_active, created_at,
        classes:class_id (
          name, semester, section,
          departments:department_id (name)
        )
      `)
            .eq('id', id)
            .single();
        if (error) {
            throw new HttpError(404, 'Student not found');
        }
        return student;
    }
    static async updateStudent(id, data) {
        const { data: student, error } = await supabase
            .from('students')
            .update(data)
            .eq('id', id)
            .select(`
        id, email, name, roll_number, phone, class_id, date_of_birth,
        address, guardian_name, guardian_phone, admission_date, is_active, created_at,
        classes:class_id (
          name, semester, section,
          departments:department_id (name)
        )
      `)
            .single();
        if (error) {
            throw new HttpError(400, `Failed to update student: ${error.message}`);
        }
        return student;
    }
    static async deleteStudent(id) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
        if (error) {
            throw new HttpError(400, `Failed to delete student: ${error.message}`);
        }
        return { message: 'Student deleted successfully' };
    }
    static async getStudentStats() {
        const { data: stats, error } = await supabase
            .from('students')
            .select(`
        id, is_active,
        classes!inner (
          semester,
          departments!inner (name)
        )
      `);
        if (error) {
            throw new HttpError(400, `Failed to fetch student stats: ${error.message}`);
        }
        const total = stats?.length || 0;
        const active = stats?.filter(s => s.is_active).length || 0;
        const semesterCounts = stats?.reduce((acc, s) => {
            const semester = s.classes?.semester || 0;
            acc[`Semester ${semester}`] = (acc[`Semester ${semester}`] || 0) + 1;
            return acc;
        }, {}) || {};
        const departmentCounts = stats?.reduce((acc, s) => {
            const deptName = s.classes?.departments?.name || 'Unknown';
            acc[deptName] = (acc[deptName] || 0) + 1;
            return acc;
        }, {}) || {};
        return {
            total,
            active,
            inactive: total - active,
            bySemester: semesterCounts,
            byDepartment: departmentCounts,
        };
    }
}
