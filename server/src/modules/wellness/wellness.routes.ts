import { Router } from 'express';
import { getHistory, logMetric, logWaterIntake } from './wellness.controller';
import { validate } from '../../middlewares/validate.middleware';
import { logWellnessSchema, logWaterSchema } from './wellness.schema';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/history', getHistory);
router.post('/metric', validate(logWellnessSchema), logMetric);
router.post('/water', validate(logWaterSchema), logWaterIntake);

export default router;
