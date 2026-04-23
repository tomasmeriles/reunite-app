// ─── Enums ────────────────────────────────────────────────────────────────────

export type GlobalRole = 'SUPER_ADMIN' | 'MODERATOR' | 'MEMBER';
export type EventRole = 'OWNER' | 'ORGANIZER';

// ─── CASL ─────────────────────────────────────────────────────────────────────

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subject =
  | 'User'
  | 'EventStaff'
  | 'AuditLog'
  | 'Event'
  | 'EventConfig'
  | 'InviteLink'
  | 'EventWhitelistEntry'
  | 'EventAttendee'
  | 'ChatMessage'
  | 'MediaItem'
  | 'Prize'
  | 'all';

export interface PackedAbility {
  action: Action | Action[];
  subject: Subject | Subject[];
  conditions?: Record<string, unknown>;
  inverted?: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatar: string | null;
  globalRole: GlobalRole;
  emailVerifiedAt: string | null;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  requestId: string | null;
}
