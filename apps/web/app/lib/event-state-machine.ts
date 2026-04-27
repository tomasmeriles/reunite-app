import type { EventStatus } from '~/api/events/events.types';

export interface ConfirmationConfig {
  title: string;
  description: string;
}

export interface StatusTransition {
  to: EventStatus;
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  /** The most natural next step — shown as the primary action in split buttons. */
  isPrimary?: boolean;
  /** When set, the transition requires a ConfirmModal before firing. */
  requiresConfirmation?: ConfirmationConfig;
}

export interface StatusMeta {
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  colorClass: string;
  dotClass: string;
}

// ── Status metadata ────────────────────────────────────────────────────────────

export const STATUS_META: Record<EventStatus, StatusMeta> = {
  DRAFT: {
    label: 'Draft',
    description: 'Created but not yet published',
    variant: 'secondary',
    colorClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  PUBLISHED: {
    label: 'Published',
    description: 'Visible and accepting registrations',
    variant: 'default',
    colorClass: 'bg-info text-info-foreground',
    dotClass: 'bg-info',
  },
  ACTIVE: {
    label: 'Live',
    description: 'Event is currently happening',
    variant: 'default',
    colorClass: 'bg-success text-success-foreground',
    dotClass: 'bg-success',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    description: 'Date was changed after publishing',
    variant: 'outline',
    colorClass: 'bg-warning text-warning-foreground',
    dotClass: 'bg-warning',
  },
  ENDED: {
    label: 'Ended',
    description: 'Event has concluded',
    variant: 'secondary',
    colorClass: 'bg-secondary text-secondary-foreground',
    dotClass: 'bg-muted-foreground',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Cancelled by the organizer',
    variant: 'destructive',
    colorClass: 'bg-destructive text-destructive-foreground',
    dotClass: 'bg-destructive',
  },
};

// ── Valid transitions ─────────────────────────────────────────────────────────

const TRANSITIONS: Record<EventStatus, StatusTransition[]> = {
  DRAFT: [
    {
      to: 'PUBLISHED',
      label: 'Publish',
      description: 'Make the event visible and open for registrations',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'CANCELLED',
      label: 'Cancel event',
      description: 'Cancel this event permanently',
      variant: 'destructive',
      requiresConfirmation: {
        title: 'Cancel event?',
        description:
          'This event will be cancelled. Attendees will no longer be able to join.',
      },
    },
  ],
  PUBLISHED: [
    {
      to: 'ACTIVE',
      label: 'Go live',
      description: 'Mark as currently happening',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'DRAFT',
      label: 'Unpublish',
      description: 'Move back to draft',
      variant: 'secondary',
    },
    {
      to: 'CANCELLED',
      label: 'Cancel event',
      description: 'Cancel this event permanently',
      variant: 'destructive',
      requiresConfirmation: {
        title: 'Cancel event?',
        description:
          'This event will be cancelled. All registered attendees will lose access.',
      },
    },
  ],
  ACTIVE: [
    {
      to: 'ENDED',
      label: 'End event',
      description: 'Mark the event as concluded',
      variant: 'default',
      isPrimary: true,
      requiresConfirmation: {
        title: 'End event?',
        description:
          'This will conclude the event. Attendees will no longer be able to join or interact.',
      },
    },
    {
      to: 'CANCELLED',
      label: 'Cancel event',
      description: 'Cancel this event',
      variant: 'destructive',
      requiresConfirmation: {
        title: 'Cancel live event?',
        description:
          'The event is currently live. Cancelling will immediately stop it for all attendees.',
      },
    },
  ],
  RESCHEDULED: [
    {
      to: 'PUBLISHED',
      label: 'Re-publish',
      description: 'Make visible again at the new date',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'ACTIVE',
      label: 'Go live',
      description: 'Mark as currently happening',
      variant: 'default',
    },
    {
      to: 'CANCELLED',
      label: 'Cancel event',
      description: 'Cancel this event',
      variant: 'destructive',
      requiresConfirmation: {
        title: 'Cancel event?',
        description:
          'This event will be cancelled. All registered attendees will lose access.',
      },
    },
  ],
  ENDED: [],
  CANCELLED: [
    {
      to: 'DRAFT',
      label: 'Restore to draft',
      description: 'Restore this event to draft state',
      variant: 'outline',
      isPrimary: true,
      requiresConfirmation: {
        title: 'Restore to draft?',
        description:
          'All event data (attendees, messages, media) is preserved. The event will stay hidden until you publish again.',
      },
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getStatusTransitions(status: EventStatus): StatusTransition[] {
  return TRANSITIONS[status] ?? [];
}

export function getPrimaryTransition(
  status: EventStatus,
): StatusTransition | null {
  const transitions = getStatusTransitions(status);
  return transitions.find((t) => t.isPrimary) ?? transitions[0] ?? null;
}

export function getSecondaryTransitions(
  status: EventStatus,
): StatusTransition[] {
  const transitions = getStatusTransitions(status);
  const primary = getPrimaryTransition(status);
  return transitions.filter((t) => t.to !== primary?.to);
}

export const EDITABLE_STATUSES: EventStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'RESCHEDULED',
];

export const READ_ONLY_STATUSES: EventStatus[] = ['ACTIVE', 'ENDED', 'CANCELLED'];

export function isEventEditable(status: EventStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}
