import { Request, Response, NextFunction } from 'express';
import * as familyService from './family.service';
import { sendSuccess, sendError } from '@/utils/response';
import { logAuditEvent } from '@/modules/audit/audit.service';

import { User } from '@supabase/supabase-js';

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const members = await familyService.getFamilyMembers(user.id);
    return res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { email, relation } = req.body;
    const newMember = await familyService.inviteFamilyMember(user.id, email, relation);

    logAuditEvent({
      userId: user.id,
      action: 'FAMILY_INVITE',
      entity: 'FamilyMember',
      entityId: newMember.id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, newMember, 201);
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const updated = await familyService.acceptInvitation(user.id, id as string);

    if (updated) {
      logAuditEvent({
        userId: user.id,
        action: 'FAMILY_INVITATION_ACCEPT',
        entity: 'FamilyMember',
        entityId: id,
        metadata: { requestId: req.id, ip: req.ip, status: 'success' },
      });
    }

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { role } = req.body;
    const updated = await familyService.updateRole(user.id, id as string, role);
    if (!updated) {
      return sendError(res, 'Member not found', 404);
    }

    logAuditEvent({
      userId: user.id,
      action: 'FAMILY_ROLE_UPDATE',
      entity: 'FamilyMember',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { sharesMedication, sharesWellness } = req.body;

    const updated = await familyService.updatePermissions(
      user.id,
      id as string,
      sharesMedication,
      sharesWellness,
    );
    if (!updated) {
      return sendError(res, 'Member not found or unauthorized', 404);
    }

    logAuditEvent({
      userId: user.id,
      action: 'FAMILY_PERMISSIONS_UPDATE',
      entity: 'FamilyMember',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: User }).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const removed = await familyService.removeFamilyMember(user.id, id as string);
    if (!removed) {
      return sendError(res, 'Member not found or unauthorized', 404);
    }

    logAuditEvent({
      userId: user.id,
      action: 'FAMILY_MEMBER_REMOVE',
      entity: 'FamilyMember',
      entityId: id,
      metadata: { requestId: req.id, ip: req.ip, status: 'success' },
    });

    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
};
