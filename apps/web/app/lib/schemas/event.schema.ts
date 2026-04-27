import { z } from 'zod';
import { DateTime } from 'luxon';
import { getSystemTimezone, toLocalDateTime } from '~/lib/datetime';
import type { Event } from '~/api/events/events.types';

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export const createEventBaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  eventType: z.enum(['PUBLIC', 'INVITE_LINK', 'INVITE_ACCOUNT']),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startAt: z.string().min(1, 'Start date is required'),
  duration: z
    .string({ required_error: 'Duration is required' })
    .regex(/^\d+:\d{2}$/, 'Use HH:MM format')
    .refine((v) => hhmmToMinutes(v) >= 1, 'Duration must be at least 1 minute'),
  timezone: z.string(),
  maxAttendees: z.number().int('Must be a whole number').min(1, 'Must be at least 1').optional(),
});

export const createEventSchema = createEventBaseSchema.superRefine(
  (data, ctx) => {
    const start = data.startAt ? DateTime.fromISO(data.startAt) : null;

    if (start?.isValid && start <= DateTime.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be in the future',
        path: ['startAt'],
      });
    }
  },
);

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventBaseSchema.partial().extend({
  startAt: z.string().optional(),
  duration: z
    .string()
    .regex(/^\d+:\d{2}$/, 'Use HH:MM format')
    .refine((v) => hhmmToMinutes(v) >= 1, 'Duration must be at least 1 minute')
    .optional(),
});

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;

type BaseEventFormValues = z.infer<typeof createEventBaseSchema>;

function serializeDates(
  values: Partial<BaseEventFormValues> & { timezone?: string; duration?: string },
) {
  const toISO = (date: string) =>
    DateTime.fromISO(date, { zone: values.timezone ?? 'UTC' }).toISO() ?? date;
  const { startAt, duration, ...rest } = values;
  return {
    ...rest,
    ...(startAt ? { startAt: toISO(startAt) } : {}),
    ...(duration !== undefined ? { duration: hhmmToMinutes(duration) } : {}),
  };
}

export function toApiPayload(values: BaseEventFormValues): Omit<ReturnType<typeof serializeDates>, 'duration'> & { startAt: string; title: string; duration: number; timezone: string; eventType: BaseEventFormValues['eventType'] };
export function toApiPayload(values: UpdateEventFormValues): Omit<ReturnType<typeof serializeDates>, 'duration'> & { duration?: number };
export function toApiPayload(values: BaseEventFormValues | UpdateEventFormValues) {
  return serializeDates(values);
}

export function eventToFormDefaults(event: Event): UpdateEventFormValues {
  const tz = event.timezone ?? getSystemTimezone();
  return {
    title: event.title,
    description: event.description ?? '',
    eventType: event.eventType,
    location: event.location ?? '',
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    timezone: tz,
    startAt: toLocalDateTime(event.startAt, tz),
    duration: minutesToHHMM(event.duration),
    maxAttendees: event.maxAttendees ?? undefined,
  };
}
