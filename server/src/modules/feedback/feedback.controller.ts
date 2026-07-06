import { Request, Response, NextFunction } from 'express';
import * as feedbackService from './feedback.service';
import { sendSuccess } from '@/utils/response';

import { User } from '@supabase/supabase-js';

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { category, text } = req.body;
    const feedback = await feedbackService.submitFeedback(user.id, category, text);
    return sendSuccess(res, feedback, 201);
  } catch (error) {
    next(error);
  }
};
