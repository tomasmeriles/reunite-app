import type { EventStatus } from '~/api/events/events.types';

export interface ConfirmationConfig {
  titleKey: string;
  descriptionKey: string;
}

export interface StatusTransition {
  to: EventStatus;
  labelKey: string;
  descriptionKey: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  isPrimary?: boolean;
  requiresConfirmation?: ConfirmationConfig;
}

export interface StatusMeta {
  descriptionKey: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  colorClass: string;
  dotClass: string;
}

// ── Status metadata ────────────────────────────────────────────────────────────

export const STATUS_META: Record<EventStatus, StatusMeta> = {
  DRAFT: {
    descriptionKey: 'statusMeta.DRAFT.description',
    variant: 'secondary',
    colorClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  PUBLISHED: {
    descriptionKey: 'statusMeta.PUBLISHED.description',
    variant: 'default',
    colorClass: 'bg-info text-info-foreground',
    dotClass: 'bg-info',
  },
  ACTIVE: {
    descriptionKey: 'statusMeta.ACTIVE.description',
    variant: 'default',
    colorClass: 'bg-success text-success-foreground',
    dotClass: 'bg-success',
  },
  RESCHEDULED: {
    descriptionKey: 'statusMeta.RESCHEDULED.description',
    variant: 'outline',
    colorClass: 'bg-warning text-warning-foreground',
    dotClass: 'bg-warning',
  },
  ENDED: {
    descriptionKey: 'statusMeta.ENDED.description',
    variant: 'secondary',
    colorClass: 'bg-secondary text-secondary-foreground',
    dotClass: 'bg-muted-foreground',
  },
  CANCELLED: {
    descriptionKey: 'statusMeta.CANCELLED.description',
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
      labelKey: 'transitions.toPublished.label',
      descriptionKey: 'transitions.toPublished.description',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'CANCELLED',
      labelKey: 'transitions.toCancelled.label',
      descriptionKey: 'transitions.toCancelled.description',
      variant: 'destructive',
      requiresConfirmation: {
        titleKey: 'transitions.confirms.cancelFromDraft.title',
        descriptionKey: 'transitions.confirms.cancelFromDraft.description',
      },
    },
  ],
  PUBLISHED: [
    {
      to: 'ACTIVE',
      labelKey: 'transitions.toActive.label',
      descriptionKey: 'transitions.toActive.description',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'CANCELLED',
      labelKey: 'transitions.toCancelled.label',
      descriptionKey: 'transitions.toCancelled.description',
      variant: 'destructive',
      requiresConfirmation: {
        titleKey: 'transitions.confirms.cancelFromPublished.title',
        descriptionKey: 'transitions.confirms.cancelFromPublished.description',
      },
    },
  ],
  ACTIVE: [
    {
      to: 'ENDED',
      labelKey: 'transitions.toEnded.label',
      descriptionKey: 'transitions.toEnded.description',
      variant: 'default',
      isPrimary: true,
      requiresConfirmation: {
        titleKey: 'transitions.confirms.endEvent.title',
        descriptionKey: 'transitions.confirms.endEvent.description',
      },
    },
    {
      to: 'CANCELLED',
      labelKey: 'transitions.toCancelled.label',
      descriptionKey: 'transitions.toCancelled.description',
      variant: 'destructive',
      requiresConfirmation: {
        titleKey: 'transitions.confirms.cancelFromActive.title',
        descriptionKey: 'transitions.confirms.cancelFromActive.description',
      },
    },
  ],
  RESCHEDULED: [
    {
      to: 'ACTIVE',
      labelKey: 'transitions.toActiveFromRescheduled.label',
      descriptionKey: 'transitions.toActiveFromRescheduled.description',
      variant: 'default',
      isPrimary: true,
    },
    {
      to: 'CANCELLED',
      labelKey: 'transitions.toCancelled.label',
      descriptionKey: 'transitions.toCancelled.description',
      variant: 'destructive',
      requiresConfirmation: {
        titleKey: 'transitions.confirms.cancelFromRescheduled.title',
        descriptionKey: 'transitions.confirms.cancelFromRescheduled.description',
      },
    },
  ],
  ENDED: [],
  CANCELLED: [],
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

export function canEditEventAccess(status: EventStatus): boolean {
  return status === 'DRAFT';
}
