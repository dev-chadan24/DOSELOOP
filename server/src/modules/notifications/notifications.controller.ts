import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import * as notificationsService from './notifications.service';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await notificationsService.getNotifications(user.id, page, limit);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const success = await notificationsService.markAsRead(user.id, id as string);
    if (!success) return res.status(403).json({ error: 'Forbidden or Not Found' });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await notificationsService.markAllAsRead(user.id);
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
