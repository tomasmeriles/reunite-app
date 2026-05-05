import { Prisma } from '@prisma/client';

export const attendeeListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
    },
  },
  inviteLink: {
    select: {
      id: true,
      maxUses: true,
      useCount: true,
    },
  },
} satisfies Prisma.EventAttendeeInclude;

export type AttendeeListPayload = Prisma.EventAttendeeGetPayload<{
  include: typeof attendeeListInclude;
}>;

export const attendeeDetailInclude = {
  ...attendeeListInclude,
  event: true,
  sponsoredGuests: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  },
  mediaItems: true,
  prizes: true,
} satisfies Prisma.EventAttendeeInclude;

export type AttendeeDetailPayload = Prisma.EventAttendeeGetPayload<{
  include: typeof attendeeDetailInclude;
}>;
