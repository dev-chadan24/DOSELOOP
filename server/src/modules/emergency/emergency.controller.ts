import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import * as emergencyService from './emergency.service';
import { sendSuccess } from '../../utils/response';
import { logAuditEvent } from '../../modules/audit/audit.service';

export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await emergencyService.getContacts(user.id, page, limit);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const createEmergencyContact = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const contact = await emergencyService.createContact(user.id, req.body);

    logAuditEvent({
      userId: user.id,
      action: 'EMERGENCY_CONTACT_CREATE',
      entity: 'EmergencyContact',
      entityId: contact.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, contact, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const deleteEmergencyContact = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const success = await emergencyService.deleteContact(user.id, id as string);
    if (!success) return res.status(403).json({ error: 'Forbidden or Not Found' });

    logAuditEvent({
      userId: user.id,
      action: 'EMERGENCY_CONTACT_DELETE',
      entity: 'EmergencyContact',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const triggerSOS = async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await emergencyService.triggerSOS(user.id, req.body);

    logAuditEvent({
      userId: user.id,
      action: 'SOS_TRIGGERED',
      entity: 'EmergencyEvent',
      entityId: result.eventId,
      metadata: { requestId: req.id, ip: req.ip, status: 'success', emailsSent: result.emailsSent },
    });

    return sendSuccess(res, result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
