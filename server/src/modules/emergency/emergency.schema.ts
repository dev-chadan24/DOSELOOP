import { z } from 'zod';

export const createEmergencyContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    relation: z.string().min(1, 'Relation is required'),
    phone: z.string().min(1, 'Phone is required'),
    isPrimary: z.boolean().optional(),
  }),
});

export const triggerSOSSchema = z.object({
  body: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    accuracy: z.number().optional(),
    timestamp: z.string().optional().or(z.number().optional()),
    mapsUrl: z.string().optional(),
  }),
});
