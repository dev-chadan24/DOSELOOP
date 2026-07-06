import { z } from 'zod';

export const createMedicationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    form: z.string().optional(),
    critical: z.boolean().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
    refillIn: z.number().int().nonnegative().optional(),
    schedule: z.string().optional(),
    times: z
      .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:mm format'))
      .optional(),
  }),
});

export const updateDoseStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'taken',
      'skipped',
      'snoozed',
      'upcoming',
      'due',
      'missed',
      'TAKEN',
      'SKIPPED',
      'SNOOZED',
      'UPCOMING',
      'MISSED',
    ]),
  }),
});
