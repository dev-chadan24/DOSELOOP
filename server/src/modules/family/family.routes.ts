import { Router } from 'express';
import {
  getMembers,
  inviteMember,
  updatePermissions,
  removeMember,
  acceptInvitation,
  updateRole,
} from './family.controller';
import { validate } from '@/middlewares/validate.middleware';
import { z } from 'zod';
import { inviteFamilyMemberSchema, updatePermissionsSchema } from './family.schema';
import { uuidParamSchema } from '@/middlewares/common.schema';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getMembers);
router.post('/invite', validate(inviteFamilyMemberSchema), inviteMember);
router.post('/:id/accept', validate(uuidParamSchema), acceptInvitation);
router.put(
  '/:id/role',
  validate(z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({ role: z.enum(['OWNER', 'CONNECTED', 'VIEWER']) }) })),
  updateRole,
);
router.put('/:id/permissions', validate(updatePermissionsSchema), updatePermissions);
router.delete('/:id', validate(uuidParamSchema), removeMember);

export default router;
