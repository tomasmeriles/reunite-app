import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EventStatus } from '@prisma/client';

type DbWithEvent = {
  event: {
    findUnique(args: {
      where: { id: string };
      select: { status: true };
    }): Promise<{ status: EventStatus } | null>;
  };
};

/** Throws ForbiddenException if currentStatus is not in the allowed list. */
export function assertEventStatus(
  currentStatus: EventStatus,
  ...allowed: EventStatus[]
): void {
  if (!allowed.includes(currentStatus)) {
    throw new ForbiddenException(
      `Action not allowed when event is ${currentStatus}. Allowed: ${allowed.join(', ')}.`,
    );
  }
}

/** Fetches the event by id, throws NotFoundException if missing, then asserts status. */
export async function requireEventStatus(
  db: DbWithEvent,
  eventId: string,
  ...allowed: EventStatus[]
): Promise<void> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  if (!event) throw new NotFoundException('Event not found');
  assertEventStatus(event.status, ...allowed);
}
