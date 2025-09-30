import pinoLogger from 'pino';
const isDevelopment = process.env.NODE_ENV !== 'production';
export const logger = pinoLogger({
    level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
            },
        }
        : undefined,
});
