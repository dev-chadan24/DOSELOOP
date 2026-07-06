import { Request, Response, NextFunction } from 'express';
import * as wellnessService from './wellness.service';
import { sendSuccess } from '@/utils/response';

import { User } from '@supabase/supabase-js';

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const type = (req.query.type as 'all' | 'mood' | 'water') || 'all';
    const data = await wellnessService.getWellnessHistory(user.id, type);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const logMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { label, icon, value, unit, goal, tone } = req.body;
    const newLog = await wellnessService.logWellness(user.id, label, icon, value, unit, goal, tone);
    return sendSuccess(res, newLog, 201);
  } catch (error) {
    next(error);
  }
};

export const logWaterIntake = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { amountMl } = req.body;
    const newLog = await wellnessService.logWater(user.id, amountMl);
    return sendSuccess(res, newLog, 201);
  } catch (error) {
    next(error);
  }
};
