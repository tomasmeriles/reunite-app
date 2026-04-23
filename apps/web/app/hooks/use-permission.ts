import { subject } from '@casl/ability';
import type { Action, Subject } from '~/lib/types';
import { useAuth } from '~/contexts/auth';
import { useMyAttendance } from '~/hooks/api/use-attendance';
import { useEvent } from '~/hooks/api/use-events';

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
  canEdit: boolean;
  canDelete: boolean;
  canManageAttendees: boolean;
  canManageInvites: boolean;
  canManageConfig: boolean;
  canManageStaff: boolean;

  // ── Merged actions (staff OR attendee depending on config) ─────────────────
  /** Organizers always; attendees only when chatEnabled */
  canChat: boolean;
  /** Organizers always; attendees only when mediaEnabled */
  canUploadMedia: boolean;
  /** Organizers always; attendees only when prizesEnabled */
  canSeePrizes: boolean;
  /** Organizers always; attendees when attendeesPublic OR confirmed */
  canSeeAttendees: boolean;
}

/**
 * Single hook that merges CASL abilities (organizers) with config + attendance
 * status (attendees) into one consistent access object.
 *
 * Rule changes only need to be made here — callers never need to OR two hooks.
 *
 * @example
 * const { isOwner, canChat, canEdit } = useEventAccess(eventId);
 */
export function useEventAccess(eventId: string): EventAccess {
  const { ability } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { data: event } = useEvent(eventId);

  const config = event?.config;
  const isConfirmedAttendee = attendance?.status === 'CONFIRMED';

  // ── Staff-only actions ─────────────────────────────────────────────────────
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
  const staffCanChat = ability.can(
    'create',
    subject('ChatMessage', { eventId }),
  );
  const staffCanMedia = ability.can(
    'manage',
    subject('MediaItem', { eventId }),
  );
  const staffCanPrizes = ability.can('read', subject('Prize', { eventId }));
  const staffCanSeeAttendees = ability.can(
    'read',
    subject('EventAttendee', { eventId }),
  );

  return {
    canEdit,
    canDelete,
    canManageAttendees,
    canManageInvites,
    canManageConfig,
    canManageStaff,

    canChat: staffCanChat || (isConfirmedAttendee && !!config?.chatEnabled),
    canUploadMedia:
      staffCanMedia || (isConfirmedAttendee && !!config?.mediaEnabled),
    canSeePrizes:
      staffCanPrizes || (isConfirmedAttendee && !!config?.prizesEnabled),
    canSeeAttendees:
      staffCanSeeAttendees || !!config?.attendeesPublic || isConfirmedAttendee,
  };
}
