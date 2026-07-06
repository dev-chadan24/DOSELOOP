import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { getDashboardSummary, getAnalytics } from './dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);
router.get('/analytics', getAnalytics);

export default router;
