import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/config/logger';

/**
 * Structured payload for a security-sensitive audit event.
 *
 * Never include passwords, JWTs, refresh tokens, cookies, OTPs,
 * authorization headers, PHI, or medical notes in `metadata`.
 */
export interface AuditEvent {
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | string[];
  metadata?: Record<string, unknown>;
}

/**
 * Persist an audit log entry using the existing Prisma AuditLog model.
 *
 * This function is intentionally **non-blocking**: if the database write
 * fails the error is logged as a warning but the caller is never disrupted.
 * User-facing operations must never break because audit logging is temporarily
 * unavailable.
 */
export const logAuditEvent = (event: AuditEvent): void => {
  prisma.auditLog
    .create({
      data: {
        userId: event.userId,
        action: event.action,
        entity: event.entity,
        entityId: Array.isArray(event.entityId) ? event.entityId[0] : (event.entityId ?? null),
        metadata: (event.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    })
    .catch((err: unknown) => {
      logger.warn('Audit log write failed', {
        action: event.action,
        entity: event.entity,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });
};
