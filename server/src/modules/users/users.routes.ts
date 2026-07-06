import { Router } from 'express';
import { getProfile, updateProfile } from './users.controller';
import { validate } from '@/middlewares/validate.middleware';
import { updateProfileSchema } from './users.schema';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

export default router;
