import { z } from 'zod';
import { DateTime } from 'luxon';

export const createEventBaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  eventType: z.enum(['PUBLIC', 'INVITE_LINK', 'INVITE_ACCOUNT']),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().optional(),
  timezone: z.string(),
});

export const createEventSchema = createEventBaseSchema.superRefine(
  (data, ctx) => {
    const start = data.startAt ? DateTime.fromISO(data.startAt) : null;
    const end = data.endAt ? DateTime.fromISO(data.endAt) : null;

    if (start?.isValid && start <= DateTime.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be in the future',
        path: ['startAt'],
      });
    }

    if (start?.isValid && end?.isValid && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endAt'],
      });
    }
  },
);

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
