import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

/**
 * Middleware that attaches a unique request ID to every incoming request.
 *
 * - Uses the built-in `crypto.randomUUID()` (no external dependencies).
 * - Respects an existing `X-Request-Id` header from upstream proxies / load balancers.
 * - Exposes the same ID on the response via the `X-Request-Id` header.
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
