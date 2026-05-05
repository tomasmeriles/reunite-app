import { BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [
    EventStatus.ACTIVE,
    EventStatus.RESCHEDULED,
    EventStatus.CANCELLED,
  ],
  [EventStatus.ACTIVE]: [EventStatus.ENDED, EventStatus.CANCELLED],
  [EventStatus.RESCHEDULED]: [
    EventStatus.ACTIVE,
    EventStatus.CANCELLED,
  ],
  [EventStatus.ENDED]: [],
  [EventStatus.CANCELLED]: [],
};

export const FULLY_EDITABLE_STATUSES: EventStatus[] = [EventStatus.DRAFT];

export const PARTIALLY_EDITABLE_STATUSES: EventStatus[] = [
  EventStatus.PUBLISHED,
  EventStatus.RESCHEDULED,
];

export const CONTENT_EDITABLE_STATUSES: EventStatus[] = [
  ...FULLY_EDITABLE_STATUSES,
  ...PARTIALLY_EDITABLE_STATUSES,
];

export const CONFIG_EDITABLE_STATUSES: EventStatus[] = [
  EventStatus.DRAFT,
  EventStatus.PUBLISHED,
  EventStatus.RESCHEDULED,
];

export function isContentEditableStatus(status: EventStatus): boolean {
  return CONTENT_EDITABLE_STATUSES.includes(status);
}

export function isFullyEditableStatus(status: EventStatus): boolean {
  return FULLY_EDITABLE_STATUSES.includes(status);
}

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
    throw new BadRequestException({
      code: ErrorCode.INVALID_STATUS_TRANSITION,
    });
  }
}
