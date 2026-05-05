import { subject } from '@casl/ability';
import type { Action, Subject } from '~/lib/types';
import { useAuth } from '~/contexts/auth';
import { useMyAttendance } from '~/hooks/api/use-attendance';
import { useEvent } from '~/hooks/api/use-events';
import {
  canEditEventAccess,
  isEventEditable,
} from '~/lib/event-state-machine';

// ---------------------------------------------------------------------------
// Primitive hooks
// ---------------------------------------------------------------------------

/**
 * Global permission check with no event scope.
 * Useful for platform-level checks (SUPER_ADMIN, own-user actions).
 */
export function usePermission(action: Action, resource: Subject): boolean {
  const { ability } = useAuth();
  return ability.can(action, resource);
}

/**
 * Event-scoped permission check that evaluates CASL conditions.
 * - `Event` rules use condition `{ id: eventId }`
 * - All other subjects use condition `{ eventId }`
 */
export function useEventPermission(
  action: Action,
  resource: Exclude<Subject, 'all'>,
  eventId: string,
): boolean {
  const { ability } = useAuth();
  const obj = resource === 'Event' ? { id: eventId } : { eventId };
  return ability.can(action, subject(resource, obj));
}

// ---------------------------------------------------------------------------
// useEventAccess — unified access hook for any event-scoped page
// ---------------------------------------------------------------------------

export interface EventAccess {
  // ── Staff-only actions (CASL) ──────────────────────────────────────────────
  isStaff: boolean;
  canEdit: boolean;
  canEditAccess: boolean;
  canDelete: boolean;
  canManageAttendees: boolean;
  canManageInvites: boolean;
  canManageConfig: boolean;
  canManageStaff: boolean;

  // ── Merged actions (staff OR attendee depending on config) ─────────────────
  /** Only during ACTIVE; staff always (unless DISABLED), attendees when ATTENDEES_ONLY or ANYONE */
  canUploadMedia: boolean;
  /** Organizers always; attendees only when prizesEnabled */
  canSeePrizes: boolean;
  /** Organizers always; attendees per attendeeAccess (ANYONE/ATTENDEES_ONLY) */
  canSeeAttendees: boolean;

  // ── Archival access (ACTIVE and ENDED) ────────────────────────────────────
  /** Can view media gallery: ACTIVE or ENDED */
  canViewMedia: boolean;
}

/**
 * Single hook that merges CASL abilities (organizers) with config + attendance
 * status (attendees) into one consistent access object.
 *
 * Rule changes only need to be made here — callers never need to OR two hooks.
 *
 * @example
 * const { isStaff, canEdit, canViewMedia } = useEventAccess(eventId);
 */
export function useEventAccess(eventId: string): EventAccess {
  const { ability } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { data: event } = useEvent(eventId);

  const config = event?.config;
  const isConfirmedAttendee = attendance?.status === 'CONFIRMED';

  // ── Staff-only actions ─────────────────────────────────────────────────────
  const isStaff =
    ability.can('update', subject('Event', { id: eventId })) ||
    ability.can('manage', subject('EventAttendee', { eventId }));
  const canEdit = ability.can('update', subject('Event', { id: eventId }));
  const canDelete = ability.can('delete', subject('Event', { id: eventId }));
  const canManageAttendees = ability.can(
    'manage',
    subject('EventAttendee', { eventId }),
  );
  const canManageInvites = ability.can(
    'manage',
    subject('InviteLink', { eventId }),
  );
  const canManageConfig = ability.can(
    'manage',
    subject('EventConfig', { eventId }),
  );
  const canManageStaff = ability.can(
    'manage',
    subject('EventStaff', { eventId }),
  );

  // ── Merged actions ─────────────────────────────────────────────────────────
  const staffCanMedia = ability.can(
    'manage',
    subject('MediaItem', { eventId }),
  );
  const staffCanPrizes = ability.can('read', subject('Prize', { eventId }));
  const staffCanSeeAttendees = ability.can(
    'read',
    subject('EventAttendee', { eventId }),
  );

  const status = event?.status;
  const isLive = status === 'ACTIVE';
  const isEnded = status === 'ENDED';
  const isEditable = status ? isEventEditable(status) : false;
  const isAccessEditable = status ? canEditEventAccess(status) : false;

  return {
    isStaff,
    canEdit: canEdit && isEditable,
    canEditAccess: canEdit && isAccessEditable,
    canDelete: canDelete && (status === 'DRAFT' || status === 'CANCELLED'),
    canManageAttendees:
      canManageAttendees && !isEnded && status !== 'CANCELLED',
    canManageInvites: canManageInvites && isEditable,
    canManageConfig: canManageConfig && isEditable,
    canManageStaff: canManageStaff && !isEnded && status !== 'CANCELLED',

    canUploadMedia:
      (staffCanMedia ||
        (isConfirmedAttendee &&
          (config?.mediaAccess === 'ATTENDEES_ONLY' ||
            config?.mediaAccess === 'ANYONE'))) &&
      isLive,
    canSeePrizes:
      (staffCanPrizes || (isConfirmedAttendee && !!config?.prizesEnabled)) &&
      (isEditable || isLive || isEnded),
    canSeeAttendees:
      staffCanSeeAttendees ||
      (config?.attendeeAccess === 'ANYONE' && event?.eventType === 'PUBLIC') ||
      (isConfirmedAttendee &&
        (config?.attendeeAccess === 'ATTENDEES_ONLY' ||
          config?.attendeeAccess === 'ANYONE')),
    canViewMedia:
      (staffCanMedia ||
        config?.mediaAccess === 'ANYONE' ||
        (isConfirmedAttendee && config?.mediaAccess === 'ATTENDEES_ONLY')) &&
      (isLive || isEnded),
  };
}
