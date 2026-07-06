import { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service';
import { sendSuccess } from '@/utils/response';
import { logAuditEvent } from '@/modules/audit/audit.service';

import { User } from '@supabase/supabase-js';

export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const updatedUser = await settingsService.updatePreferences(user.id, req.body);

    logAuditEvent({
      userId: user.id,
      action: 'SETTINGS_UPDATE',
      entity: 'User',
      entityId: user.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, updatedUser);
  } catch (error) {
    next(error);
  }
};

export const exportData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const data = await settingsService.exportData(user.id);

    logAuditEvent({
      userId: user.id,
      action: 'DATA_EXPORT',
      entity: 'User',
      entityId: user.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, data || {});
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    logAuditEvent({
      userId: user.id,
      action: 'ACCOUNT_DELETE',
      entity: 'User',
      entityId: user.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'initiated' },
    });

    await settingsService.deleteAccount(user.id);
    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
};
