import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.string().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    privacyEnabled: z.boolean().optional(),
  }),
});
