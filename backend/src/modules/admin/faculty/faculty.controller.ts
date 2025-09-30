import type { Request, Response } from 'express';
import { FacultyService } from './faculty.service.js';
import { createFacultySchema, updateFacultySchema, facultyQuerySchema } from './faculty.schemas.js';

export class FacultyController {
  static async createFaculty(req: Request, res: Response) {
    const data = createFacultySchema.parse(req.body);
    const faculty = await FacultyService.createFaculty(data);
    res.status(201).json({ success: true, data: faculty });
  }

  static async getFaculty(req: Request, res: Response) {
    const query = facultyQuerySchema.parse(req.query);
    const result = await FacultyService.getFaculty(query);
    res.json({ success: true, ...result });
  }

  static async getFacultyById(req: Request, res: Response) {
    const faculty = await FacultyService.getFacultyById(req.params.id);
    res.json({ success: true, data: faculty });
  }

  static async updateFaculty(req: Request, res: Response) {
    const data = updateFacultySchema.parse(req.body);
    const faculty = await FacultyService.updateFaculty(req.params.id, data);
    res.json({ success: true, data: faculty });
  }

  static async deleteFaculty(req: Request, res: Response) {
    const result = await FacultyService.deleteFaculty(req.params.id);
    res.json({ success: true, ...result });
  }

  static async getFacultyStats(req: Request, res: Response) {
    const stats = await FacultyService.getFacultyStats();
    res.json({ success: true, data: stats });
  }
}