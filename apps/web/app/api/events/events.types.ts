export type EventType = 'PUBLIC' | 'INVITE_LINK' | 'INVITE_ACCOUNT';
export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'RESCHEDULED'
  | 'ENDED'
  | 'CANCELLED';
export type AttendeeStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface EventConfig {
  maxAttendees: number | null;
  allowPlusOne: boolean;
  requireApproval: boolean;
  showGuestList: boolean;
  showCountdown: boolean;
}

export interface Event {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  coverImage: string | null;
  location: string | null;
  address: string | null;
  startDate: string;
  endDate: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  config?: EventConfig;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  eventType?: EventType;
  location?: string;
  startAt: string;
  endAt?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  location?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface UpdateEventStatusDto {
  status: EventStatus;
}

export interface UpdateEventConfigDto {
  maxAttendees?: number | null;
  allowPlusOne?: boolean;
  requireApproval?: boolean;
  showGuestList?: boolean;
  showCountdown?: boolean;
}
