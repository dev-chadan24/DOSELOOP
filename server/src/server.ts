import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const PORT = env.PORT || 5000;

// ---------------------------------------------------------------------------
// Start HTTP server
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  logger.info('DoseLoop server started', {
    port: PORT,
    environment: env.NODE_ENV,
  });
});

// ---------------------------------------------------------------------------
// Graceful shutdown — required for Cloud Run (SIGTERM) and K8s
// ---------------------------------------------------------------------------
// Cloud Run sends SIGTERM before stopping a container. We have up to 10s
// (the default timeout) to finish in-flight requests before being force-killed.
// We stop accepting new connections immediately, then close the server.
// ---------------------------------------------------------------------------

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received — starting graceful shutdown`);

  // Stop accepting new HTTP connections
  server.close(async (err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
    }

    // Disconnect Prisma to release DB connections back to the pool
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
    } catch (prismaErr) {
      logger.error('Error disconnecting Prisma', {
        error: prismaErr instanceof Error ? prismaErr.message : String(prismaErr),
      });
    }

    logger.info('Graceful shutdown complete');
    process.exit(err ? 1 : 0);
  });

  // Force-kill if graceful shutdown exceeds 9 seconds
  // (Cloud Run max is ~10s, so we exit slightly before being force-killed)
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 9_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Unhandled rejection / uncaught exception safety nets
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise),
  });
  // Do NOT exit — log and continue. Exiting on every unhandled rejection
  // would make Cloud Run restart loops too aggressive.
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — process may be in an unstable state', {
    error: err.message,
    stack: err.stack,
  });
  // Exit and let Cloud Run restart the container
  process.exit(1);
});
