import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { getNotifications, markAsRead, markAllAsRead } from './notifications.controller';
import { validate } from '../../middlewares/validate.middleware';
import { paginationSchema, uuidParamSchema } from '../../middlewares/common.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationSchema), getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', validate(uuidParamSchema), markAsRead);

export default router;
