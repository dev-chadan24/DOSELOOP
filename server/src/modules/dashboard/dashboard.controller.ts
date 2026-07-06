import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import * as dashboardService from './dashboard.service';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const summary = await dashboardService.getSummary(user.id);
    return res.status(200).json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const data = await dashboardService.getAnalytics(user.id);
    return res.status(200).json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
