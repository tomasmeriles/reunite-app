import { BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [
    EventStatus.ACTIVE,
    EventStatus.DRAFT,
    EventStatus.RESCHEDULED,
    EventStatus.CANCELLED,
  ],
  [EventStatus.ACTIVE]: [EventStatus.ENDED, EventStatus.CANCELLED],
  [EventStatus.RESCHEDULED]: [
    EventStatus.PUBLISHED,
    EventStatus.ACTIVE,
    EventStatus.CANCELLED,
  ],
  [EventStatus.ENDED]: [],
  [EventStatus.CANCELLED]: [EventStatus.DRAFT],
};

/**
 * Returns the allowed next statuses from the given status.
 */
export function getValidTransitions(from: EventStatus): EventStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

/**
 * Throws BadRequestException if the transition from → to is not allowed.
 * Call this before persisting a status change.
 */
export function assertValidTransition(
  from: EventStatus,
  to: EventStatus,
): void {
  if (from === to) return;
  const allowed = getValidTransitions(from);
  if (!allowed.includes(to)) {
    throw new BadRequestException({ code: ErrorCode.INVALID_STATUS_TRANSITION });
  }
}
