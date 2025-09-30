import type { Request, Response } from 'express';
import { AcademicYearsService } from './academic-years.service.js';
import { createAcademicYearSchema, updateAcademicYearSchema, academicYearQuerySchema } from './academic-years.schemas.js';

export class AcademicYearsController {
  static async createAcademicYear(req: Request, res: Response) {
    const data = createAcademicYearSchema.parse(req.body);
    const academicYear = await AcademicYearsService.createAcademicYear(data);
    res.status(201).json({ success: true, data: academicYear });
  }

  static async getAcademicYears(req: Request, res: Response) {
    const query = academicYearQuerySchema.parse(req.query);
    const result = await AcademicYearsService.getAcademicYears(query);
    res.json({ success: true, ...result });
  }

  static async getAcademicYearById(req: Request, res: Response) {
    const academicYear = await AcademicYearsService.getAcademicYearById(req.params.id);
    res.json({ success: true, data: academicYear });
  }

  static async updateAcademicYear(req: Request, res: Response) {
    const data = updateAcademicYearSchema.parse(req.body);
    const academicYear = await AcademicYearsService.updateAcademicYear(req.params.id, data);
    res.json({ success: true, data: academicYear });
  }

  static async deleteAcademicYear(req: Request, res: Response) {
    const result = await AcademicYearsService.deleteAcademicYear(req.params.id);
    res.json({ success: true, ...result });
  }

  static async getAcademicYearStats(req: Request, res: Response) {
    const stats = await AcademicYearsService.getAcademicYearStats();
    res.json({ success: true, data: stats });
  }
}