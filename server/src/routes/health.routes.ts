import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Verify database connection without exposing state
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, { status: 'ok' });
  } catch (error) {
    next(error);
  }
});

export default router;
