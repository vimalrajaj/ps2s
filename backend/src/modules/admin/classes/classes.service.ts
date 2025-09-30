import { supabase } from '../../../config/supabase.js';
import { HttpError } from '../../../middleware/error-handler.js';
import type { CreateClass, UpdateClass, ClassQuery } from './classes.schemas.js';

export class ClassesService {
  static async createClass(data: CreateClass) {
    const { data: classData, error } = await supabase
      .from('classes')
      .insert(data)
      .select(`
        *,
        departments:department_id (name),
        academic_years:academic_year_id (year)
      `)
      .single();

    if (error) {
      throw new HttpError(400, `Failed to create class: ${error.message}`);
    }

    return classData;
  }

  static async getClasses(query: ClassQuery) {
    const { page, limit, search, department_id, academic_year_id, semester } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('classes')
      .select(`
        *,
        departments:department_id (name),
        academic_years:academic_year_id (year)
      `, { count: 'exact' })
      .order('name');

    if (search) {
      dbQuery = dbQuery.or(`name.ilike.%${search}%,section.ilike.%${search}%`);
    }

    if (department_id) {
      dbQuery = dbQuery.eq('department_id', department_id);
    }

    if (academic_year_id) {
      dbQuery = dbQuery.eq('academic_year_id', academic_year_id);
    }

    if (semester) {
      dbQuery = dbQuery.eq('semester', semester);
    }

    const { data: classes, error, count } = await dbQuery
      .range(offset, offset + limit - 1);

    if (error) {
      throw new HttpError(400, `Failed to fetch classes: ${error.message}`);
    }

    return {
      data: classes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  static async getClassById(id: string) {
    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        *,
        departments:department_id (name),
        academic_years:academic_year_id (year)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new HttpError(404, 'Class not found');
    }

    return classData;
  }

  static async updateClass(id: string, data: UpdateClass) {
    const { data: classData, error } = await supabase
      .from('classes')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        departments:department_id (name),
        academic_years:academic_year_id (year)
      `)
      .single();

    if (error) {
      throw new HttpError(400, `Failed to update class: ${error.message}`);
    }

    return classData;
  }

  static async deleteClass(id: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new HttpError(400, `Failed to delete class: ${error.message}`);
    }

    return { message: 'Class deleted successfully' };
  }

  static async getClassStats() {
    const { data: stats, error } = await supabase
      .from('classes')
      .select(`
        id,
        max_students,
        department_id,
        departments!inner (name)
      `);

    if (error) {
      throw new HttpError(400, `Failed to fetch class stats: ${error.message}`);
    }

    const total = stats?.length || 0;
    const totalCapacity = stats?.reduce((sum, cls) => sum + cls.max_students, 0) || 0;
    const departmentCounts = stats?.reduce((acc, cls) => {
      const deptName = (cls.departments as any)?.name || 'Unknown';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total,
      totalCapacity,
      byDepartment: departmentCounts,
    };
  }
}