import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import {
  createMedication,
  getMedications,
  getTodayDoses,
  updateDoseStatus,
  deleteMedication,
} from './medications.controller';
import { validate } from '@/middlewares/validate.middleware';
import { createMedicationSchema, updateDoseStatusSchema } from './medications.schema';
import { paginationSchema, uuidParamSchema } from '@/middlewares/common.schema';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createMedicationSchema), createMedication);
router.get('/', validate(paginationSchema), getMedications);
router.get('/today', getTodayDoses);
router.put('/doses/:id', validate(updateDoseStatusSchema), updateDoseStatus);
router.delete('/:id', validate(uuidParamSchema), deleteMedication);

export default router;
