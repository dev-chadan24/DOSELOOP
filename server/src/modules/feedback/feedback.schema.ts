import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  body: z.object({
    category: z.enum(['bug', 'feature', 'general']),
    text: z.string().min(5, 'Feedback must be at least 5 characters long'),
  }),
});
