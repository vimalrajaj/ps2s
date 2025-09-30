import { logger } from '../utils/logger.js';
export class HttpError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace?.(this, HttpError);
    }
}
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
        logger.warn({ err }, 'Handled HttpError');
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details ?? null,
        });
    }
    logger.error({ err }, 'Unhandled error');
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
