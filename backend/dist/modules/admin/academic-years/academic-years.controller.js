import { AcademicYearsService } from './academic-years.service.js';
import { createAcademicYearSchema, updateAcademicYearSchema, academicYearQuerySchema } from './academic-years.schemas.js';
export class AcademicYearsController {
    static async createAcademicYear(req, res) {
        const data = createAcademicYearSchema.parse(req.body);
        const academicYear = await AcademicYearsService.createAcademicYear(data);
        res.status(201).json({ success: true, data: academicYear });
    }
    static async getAcademicYears(req, res) {
        const query = academicYearQuerySchema.parse(req.query);
        const result = await AcademicYearsService.getAcademicYears(query);
        res.json({ success: true, ...result });
    }
    static async getAcademicYearById(req, res) {
        const academicYear = await AcademicYearsService.getAcademicYearById(req.params.id);
        res.json({ success: true, data: academicYear });
    }
    static async updateAcademicYear(req, res) {
        const data = updateAcademicYearSchema.parse(req.body);
        const academicYear = await AcademicYearsService.updateAcademicYear(req.params.id, data);
        res.json({ success: true, data: academicYear });
    }
    static async deleteAcademicYear(req, res) {
        const result = await AcademicYearsService.deleteAcademicYear(req.params.id);
        res.json({ success: true, ...result });
    }
    static async getAcademicYearStats(req, res) {
        const stats = await AcademicYearsService.getAcademicYearStats();
        res.json({ success: true, data: stats });
    }
}
