import type { Request, Response } from 'express';
import { ClassesService } from './classes.service.js';
import { createClassSchema, updateClassSchema, classQuerySchema } from './classes.schemas.js';

export class ClassesController {
  static async createClass(req: Request, res: Response) {
    const data = createClassSchema.parse(req.body);
    const classData = await ClassesService.createClass(data);
    res.status(201).json({ success: true, data: classData });
  }

  static async getClasses(req: Request, res: Response) {
    const query = classQuerySchema.parse(req.query);
    const result = await ClassesService.getClasses(query);
    res.json({ success: true, ...result });
  }

  static async getClassById(req: Request, res: Response) {
    const classData = await ClassesService.getClassById(req.params.id);
    res.json({ success: true, data: classData });
  }

  static async updateClass(req: Request, res: Response) {
    const data = updateClassSchema.parse(req.body);
    const classData = await ClassesService.updateClass(req.params.id, data);
    res.json({ success: true, data: classData });
  }

  static async deleteClass(req: Request, res: Response) {
    const result = await ClassesService.deleteClass(req.params.id);
    res.json({ success: true, ...result });
  }

  static async getClassStats(req: Request, res: Response) {
    const stats = await ClassesService.getClassStats();
    res.json({ success: true, data: stats });
  }
}