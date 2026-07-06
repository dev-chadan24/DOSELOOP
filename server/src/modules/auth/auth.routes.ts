import { Router } from 'express';
import { syncUser } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post('/sync', requireAuth, syncUser);

export default router;
