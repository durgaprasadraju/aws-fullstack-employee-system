import { createApp } from './app';
import { config } from './config';
import { db } from './config/database';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    await db.initialize();

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`EMS Backend running on port ${config.port}`, {
        env: config.env,
        docs: `http://localhost:${config.port}/api/docs`,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await db.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

bootstrap();
