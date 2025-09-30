import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, '🚀 Backend API server ready');
  console.log(`✅ Server running at http://localhost:${env.PORT}`);
  console.log(`✅ API Health: http://localhost:${env.PORT}/api/health`);
  console.log(`✅ API Auth: http://localhost:${env.PORT}/api/auth/login`);
});