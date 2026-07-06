import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import {
  getEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
  triggerSOS,
} from './emergency.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createEmergencyContactSchema, triggerSOSSchema } from './emergency.schema';
import { paginationSchema, uuidParamSchema } from '../../middlewares/common.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationSchema), getEmergencyContacts);
router.post('/sos', validate(triggerSOSSchema), triggerSOS);
router.post('/', validate(createEmergencyContactSchema), createEmergencyContact);
router.delete('/:id', validate(uuidParamSchema), deleteEmergencyContact);

export default router;
