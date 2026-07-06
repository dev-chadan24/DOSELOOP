import { Router } from 'express';
import { submitFeedback } from './feedback.controller';
import { validate } from '../../middlewares/validate.middleware';
import { submitFeedbackSchema } from './feedback.schema';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', validate(submitFeedbackSchema), submitFeedback);

export default router;
