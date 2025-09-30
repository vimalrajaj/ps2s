import { healthService } from './health.service.js';
export const getHealth = (_req, res) => {
    const payload = healthService.getStatus();
    return res.status(200).json({
        success: true,
        data: payload,
    });
};
