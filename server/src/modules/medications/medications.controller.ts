import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import * as medicationsService from './medications.service';
import { logAuditEvent } from '@/modules/audit/audit.service';

export const createMedication = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const medication = await medicationsService.createMedication(user.id, req.body);

    logAuditEvent({
      userId: user.id,
      action: 'MEDICATION_CREATE',
      entity: 'Medication',
      entityId: medication.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return res.status(201).json(medication);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getMedications = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await medicationsService.getMedications(user.id, page, limit);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getTodayDoses = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const doses = await medicationsService.getTodayDoses(user.id);
    return res.status(200).json(doses);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const updateDoseStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status } = req.body;

    const dose = await medicationsService.updateDoseStatus(user.id, id as string, status as string);
    if (!dose) return res.status(403).json({ error: 'Forbidden or Not Found' });

    logAuditEvent({
      userId: user.id,
      action: 'DOSE_STATUS_UPDATE',
      entity: 'DoseEvent',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return res.status(200).json(dose);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const deleteMedication = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const success = await medicationsService.deleteMedication(user.id, id as string);
    if (!success) return res.status(403).json({ error: 'Forbidden or Not Found' });

    logAuditEvent({
      userId: user.id,
      action: 'MEDICATION_DELETE',
      entity: 'Medication',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
