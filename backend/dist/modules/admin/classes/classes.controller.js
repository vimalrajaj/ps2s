import { ClassesService } from './classes.service.js';
import { createClassSchema, updateClassSchema, classQuerySchema } from './classes.schemas.js';
export class ClassesController {
    static async createClass(req, res) {
        const data = createClassSchema.parse(req.body);
        const classData = await ClassesService.createClass(data);
        res.status(201).json({ success: true, data: classData });
    }
    static async getClasses(req, res) {
        const query = classQuerySchema.parse(req.query);
        const result = await ClassesService.getClasses(query);
        res.json({ success: true, ...result });
    }
    static async getClassById(req, res) {
        const classData = await ClassesService.getClassById(req.params.id);
        res.json({ success: true, data: classData });
    }
    static async updateClass(req, res) {
        const data = updateClassSchema.parse(req.body);
        const classData = await ClassesService.updateClass(req.params.id, data);
        res.json({ success: true, data: classData });
    }
    static async deleteClass(req, res) {
        const result = await ClassesService.deleteClass(req.params.id);
        res.json({ success: true, ...result });
    }
    static async getClassStats(req, res) {
        const stats = await ClassesService.getClassStats();
        res.json({ success: true, data: stats });
    }
}
