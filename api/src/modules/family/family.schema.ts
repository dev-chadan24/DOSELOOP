import { z } from 'zod';

export const inviteFamilyMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    relation: z.string().min(1, 'Relation is required'),
  }),
});

export const updatePermissionsSchema = z.object({
  body: z.object({
    sharesMedication: z.boolean().optional(),
    sharesWellness: z.boolean().optional(),
  }),
});
