import cors from 'cors';
import express, {} from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';
export const createApp = () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.get('/healthz', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            environment: env.NODE_ENV,
            uptimeSeconds: process.uptime(),
        });
    });
    app.use('/api', apiRouter);
    app.use(errorHandler);
    app.use((_req, res) => {
        res.status(404).json({ success: false, message: 'Route not found' });
    });
    return app;
};
