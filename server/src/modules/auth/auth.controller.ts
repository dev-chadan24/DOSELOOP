import { Request, Response } from 'express';
import { syncUserWithDb } from './auth.service';
import { User } from '@supabase/supabase-js';
import { logAuditEvent } from '../../modules/audit/audit.service';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const syncedUser = await syncUserWithDb(user);

    logAuditEvent({
      userId: user.id,
      action: 'USER_SYNC',
      entity: 'User',
      entityId: user.id,
      metadata: { requestId: req.id, ip: req.ip, userAgent: req.headers['user-agent'], status: 'success' },
    });

    return res.status(200).json({
      message: 'User synced successfully',
      user: syncedUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync user';
    return res.status(500).json({ error: message });
  }
};
