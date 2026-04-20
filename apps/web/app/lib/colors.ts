/**
 * Domain color maps — single source of truth for all semantic color classes.
 *
 * Rules:
 *  - Only use Tailwind classes backed by CSS variables (design tokens).
 *  - Never use raw palette classes like `bg-green-500` or `text-red-700`.
 *  - To change a color, update `app.css`. To change a mapping, update this file.
 */

import type { EventStatus, AttendeeStatus } from '~/api/events/events.types';
import type { GlobalRole, TenantRole } from '~/lib/types';
import type { AuditAction } from '~/api/audit/audit.types';

// ─── Badge classes (background + foreground) ──────────────────────────────────

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-info text-info-foreground',
  ACTIVE: 'bg-success text-success-foreground',
  RESCHEDULED: 'bg-warning text-warning-foreground',
  ENDED: 'bg-secondary text-secondary-foreground',
  CANCELLED: 'bg-destructive text-destructive-foreground',
};

export const ATTENDEE_STATUS_COLORS: Record<AttendeeStatus, string> = {
  CONFIRMED: 'bg-success text-success-foreground',
  WAITLISTED: 'bg-warning text-warning-foreground',
  CANCELLED: 'bg-destructive text-destructive-foreground',
};

export const GLOBAL_ROLE_COLORS: Record<GlobalRole, string> = {
  SUPER_ADMIN: 'bg-destructive text-destructive-foreground',
  TENANT_MANAGER: 'bg-warning text-warning-foreground',
  MEMBER: 'bg-secondary text-secondary-foreground',
};

export const TENANT_ROLE_COLORS: Record<TenantRole, string> = {
  OWNER: 'bg-info text-info-foreground',
  ADMIN: 'bg-warning text-warning-foreground',
  MEMBER: 'bg-secondary text-secondary-foreground',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  LOGIN: 'bg-info text-info-foreground',
  LOGOUT: 'bg-muted text-muted-foreground',
  REGISTER: 'bg-success text-success-foreground',
  TOKEN_REVOKED: 'bg-warning text-warning-foreground',
  UPDATE: 'bg-accent text-accent-foreground',
  DELETE: 'bg-destructive text-destructive-foreground',
};

// ─── Indicator dot classes (background only) ──────────────────────────────────

export const EVENT_STATUS_DOT: Record<EventStatus, string> = {
  DRAFT: 'bg-muted-foreground',
  PUBLISHED: 'bg-info',
  ACTIVE: 'bg-success',
  RESCHEDULED: 'bg-warning',
  ENDED: 'bg-muted-foreground',
  CANCELLED: 'bg-destructive',
};
