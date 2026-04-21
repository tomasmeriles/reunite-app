import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  eventType: z.enum(['PUBLIC', 'INVITE_LINK', 'INVITE_ACCOUNT']),
  location: z.string().optional(),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().optional(),
  timezone: z.string(),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
