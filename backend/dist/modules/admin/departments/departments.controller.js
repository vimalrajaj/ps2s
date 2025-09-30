import { departmentsService } from './departments.service.js';
import { createDepartmentSchema, updateDepartmentSchema, departmentQuerySchema } from './departments.schemas.js';
import { HttpError } from '../../../middleware/error-handler.js';
import { logger } from '../../../utils/logger.js';
export const createDepartment = async (req, res) => {
    try {
        const data = createDepartmentSchema.parse(req.body);
        const department = await departmentsService.createDepartment(data);
        return res.status(201).json({
            success: true,
            data: department,
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                details: error.details,
            });
        }
        logger.error({ error }, 'Create department controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const getDepartments = async (req, res) => {
    try {
        const params = departmentQuerySchema.parse(req.query);
        const result = await departmentsService.getDepartments(params);
        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        logger.error({ error }, 'Get departments controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const getDepartmentById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid department ID');
        }
        const department = await departmentsService.getDepartmentById(id);
        if (!department) {
            throw new HttpError(404, 'Department not found');
        }
        return res.status(200).json({
            success: true,
            data: department,
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        logger.error({ error }, 'Get department by ID controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const updateDepartment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid department ID');
        }
        const data = updateDepartmentSchema.parse(req.body);
        const department = await departmentsService.updateDepartment(id, data);
        return res.status(200).json({
            success: true,
            data: department,
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                details: error.details,
            });
        }
        logger.error({ error }, 'Update department controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const deleteDepartment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid department ID');
        }
        await departmentsService.deleteDepartment(id);
        return res.status(200).json({
            success: true,
            message: 'Department deleted successfully',
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        logger.error({ error }, 'Delete department controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const getDepartmentStats = async (_req, res) => {
    try {
        const stats = await departmentsService.getDepartmentStats();
        return res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        logger.error({ error }, 'Get department stats controller error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
