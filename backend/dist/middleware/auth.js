import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './error-handler.js';
import { logger } from '../utils/logger.js';
export const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpError(401, 'Access token is required');
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.type !== 'access') {
            throw new HttpError(401, 'Invalid token type');
        }
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
        logger.error({ error }, 'Auth middleware error');
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }
        next();
    };
};
export const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, env.JWT_SECRET);
            if (decoded.type === 'access') {
                req.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                };
            }
        }
        next();
    }
    catch (error) {
        // For optional auth, we don't throw errors, just continue without user
        next();
    }
};
