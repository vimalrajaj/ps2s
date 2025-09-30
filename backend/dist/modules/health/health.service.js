import os from 'node:os';
import { env } from '../../config/env.js';
class HealthService {
    getStatus() {
        return {
            status: 'ok',
            uptimeSeconds: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            host: {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
            },
        };
    }
}
export const healthService = new HealthService();
