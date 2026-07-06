import { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { env } from '../../config/env';

const supabase = createClient(
  env.SUPABASE_URL ?? '',
  env.SUPABASE_SERVICE_ROLE_KEY ?? '',
);

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to request object
    (req as Request & { user?: User }).user = user;

    next();
  } catch {
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
