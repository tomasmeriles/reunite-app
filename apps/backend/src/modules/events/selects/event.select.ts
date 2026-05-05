import { AttendeeStatus, EventRole, Prisma } from '@prisma/client';

export const eventListInclude = {
  config: true,
  _count: { select: { attendees: true } },
} satisfies Prisma.EventInclude;

export type EventListPayload = Prisma.EventGetPayload<{
  include: typeof eventListInclude;
}>;

export type MyEventPayload = EventListPayload & {
  myRole: EventRole | 'ATTENDEE';
};

export const eventDetailInclude = {
  config: true,
  rules: true,
  staff: { select: { userId: true, role: true } },
} satisfies Prisma.EventInclude;

export type EventDetailPayload = Prisma.EventGetPayload<{
  include: typeof eventDetailInclude;
}>;

export const eventPublicInclude = {
  config: true,
  rules: true,
  staff: { select: { userId: true, role: true } },
  _count: {
    select: { attendees: { where: { status: AttendeeStatus.CONFIRMED } } },
  },
} satisfies Prisma.EventInclude;

export type EventPublicPayload = Prisma.EventGetPayload<{
  include: typeof eventPublicInclude;
}>;

export const eventWithMembersInclude = {
  config: true,
  staff: true,
} satisfies Prisma.EventInclude;

export type EventWithMembersPayload = Prisma.EventGetPayload<{
  include: typeof eventWithMembersInclude;
}>;
