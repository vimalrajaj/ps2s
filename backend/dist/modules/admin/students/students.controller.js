import { StudentsService } from './students.service.js';
import { createStudentSchema, updateStudentSchema, studentQuerySchema } from './students.schemas.js';
export class StudentsController {
    static async createStudent(req, res) {
        const data = createStudentSchema.parse(req.body);
        const student = await StudentsService.createStudent(data);
        res.status(201).json({ success: true, data: student });
    }
    static async getStudents(req, res) {
        const query = studentQuerySchema.parse(req.query);
        const result = await StudentsService.getStudents(query);
        res.json({ success: true, ...result });
    }
    static async getStudentById(req, res) {
        const student = await StudentsService.getStudentById(req.params.id);
        res.json({ success: true, data: student });
    }
    static async updateStudent(req, res) {
        const data = updateStudentSchema.parse(req.body);
        const student = await StudentsService.updateStudent(req.params.id, data);
        res.json({ success: true, data: student });
    }
    static async deleteStudent(req, res) {
        const result = await StudentsService.deleteStudent(req.params.id);
        res.json({ success: true, ...result });
    }
    static async getStudentStats(req, res) {
        const stats = await StudentsService.getStudentStats();
        res.json({ success: true, data: stats });
    }
}
