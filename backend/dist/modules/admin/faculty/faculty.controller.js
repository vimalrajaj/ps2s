import { FacultyService } from './faculty.service.js';
import { createFacultySchema, updateFacultySchema, facultyQuerySchema } from './faculty.schemas.js';
export class FacultyController {
    static async createFaculty(req, res) {
        const data = createFacultySchema.parse(req.body);
        const faculty = await FacultyService.createFaculty(data);
        res.status(201).json({ success: true, data: faculty });
    }
    static async getFaculty(req, res) {
        const query = facultyQuerySchema.parse(req.query);
        const result = await FacultyService.getFaculty(query);
        res.json({ success: true, ...result });
    }
    static async getFacultyById(req, res) {
        const faculty = await FacultyService.getFacultyById(req.params.id);
        res.json({ success: true, data: faculty });
    }
    static async updateFaculty(req, res) {
        const data = updateFacultySchema.parse(req.body);
        const faculty = await FacultyService.updateFaculty(req.params.id, data);
        res.json({ success: true, data: faculty });
    }
    static async deleteFaculty(req, res) {
        const result = await FacultyService.deleteFaculty(req.params.id);
        res.json({ success: true, ...result });
    }
    static async getFacultyStats(req, res) {
        const stats = await FacultyService.getFacultyStats();
        res.json({ success: true, data: stats });
    }
}
