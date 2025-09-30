import { supabase } from '../../../config/supabase.js';
import { HttpError } from '../../../middleware/error-handler.js';
import type { CreateAcademicYear, UpdateAcademicYear, AcademicYearQuery } from './academic-years.schemas.js';

export class AcademicYearsService {
  static async createAcademicYear(data: CreateAcademicYear) {
    const { data: academicYear, error } = await supabase
      .from('academic_years')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new HttpError(400, `Failed to create academic year: ${error.message}`);
    }

    return academicYear;
  }

  static async getAcademicYears(query: AcademicYearQuery) {
    const { page, limit, search, is_current } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('academic_years')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false });

    if (search) {
      dbQuery = dbQuery.ilike('year', `%${search}%`);
    }

    if (is_current !== undefined) {
      dbQuery = dbQuery.eq('is_current', is_current);
    }

    const { data: academicYears, error, count } = await dbQuery
      .range(offset, offset + limit - 1);

    if (error) {
      throw new HttpError(400, `Failed to fetch academic years: ${error.message}`);
    }

    return {
      data: academicYears || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  static async getAcademicYearById(id: string) {
    const { data: academicYear, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new HttpError(404, 'Academic year not found');
    }

    return academicYear;
  }

  static async updateAcademicYear(id: string, data: UpdateAcademicYear) {
    const { data: academicYear, error } = await supabase
      .from('academic_years')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpError(400, `Failed to update academic year: ${error.message}`);
    }

    return academicYear;
  }

  static async deleteAcademicYear(id: string) {
    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id);

    if (error) {
      throw new HttpError(400, `Failed to delete academic year: ${error.message}`);
    }

    return { message: 'Academic year deleted successfully' };
  }

  static async getAcademicYearStats() {
    const { data: stats, error } = await supabase
      .from('academic_years')
      .select('id, is_current');

    if (error) {
      throw new HttpError(400, `Failed to fetch academic year stats: ${error.message}`);
    }

    const total = stats?.length || 0;
    const current = stats?.filter(ay => ay.is_current).length || 0;

    return {
      total,
      current,
      archived: total - current,
    };
  }
}