import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/v1/health  — liveness probe
// ---------------------------------------------------------------------------
// Confirms the process is alive and the HTTP server is handling requests.
// This endpoint is intentionally lightweight — it does NOT check external
// dependencies (DB, external APIs) so Cloud Run never kills a healthy instance
// just because a downstream is temporarily slow.
// ---------------------------------------------------------------------------
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/health/ready  — readiness probe
// ---------------------------------------------------------------------------
// Confirms the service can serve traffic:
//  • Database connection is alive (Prisma ping)
// Returns 503 if any dependency is unavailable so the load balancer stops
// routing new requests to this instance until it recovers.
// ---------------------------------------------------------------------------
router.get('/ready', async (_req, res, next) => {
  try {
    // Lightweight Prisma ping — validates DB connectivity without touching data
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: 'ready',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Return 503 so Cloud Run / load balancer stops routing to this instance
    return sendError(
      res,
      'Service not ready — database unavailable',
      503,
      { checks: { database: 'error' } },
    );
  }
});

export default router;
