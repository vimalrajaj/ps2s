import http from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, '🚀 API server ready');
});

const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

const gracefulShutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Received shutdown signal, closing server');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    logger.info('Server closed gracefully');
    process.exit(0);
  });
};

shutdownSignals.forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});
