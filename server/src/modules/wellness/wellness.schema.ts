import { z } from 'zod';
import { WellnessTone } from '@prisma/client';

export const logWellnessSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label is required'),
    icon: z.string().min(1, 'Icon is required'),
    value: z.number(),
    goal: z.number().optional(),
    unit: z.string().min(1, 'Unit is required'),
    tone: z.nativeEnum(WellnessTone).optional(),
  }),
});

export const logWaterSchema = z.object({
  body: z.object({
    amountMl: z.number().int().positive(),
  }),
});
