import { Router } from 'express';
import { updatePreferences, exportData, deleteAccount } from './settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { updatePreferencesSchema } from './settings.schema';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.put('/preferences', validate(updatePreferencesSchema), updatePreferences);
router.get('/export', exportData);
router.delete('/account', deleteAccount);

export default router;
