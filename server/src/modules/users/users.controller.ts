import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import { getUserProfile, updateUserProfile } from './users.service';
import { logAuditEvent } from '@/modules/audit/audit.service';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await getUserProfile(user.id);
    if (!profile) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // The body should contain updates
    const updates = req.body;
    const profile = await updateUserProfile(user.id, updates);

    logAuditEvent({
      userId: user.id,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      entityId: user.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return res.status(200).json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
