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
  id: string;
  eventId: string;
  attendeesPublic: boolean;
  chatEnabled: boolean;
  mediaEnabled: boolean;
  prizesEnabled: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  status: EventStatus;
  coverImage: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  startAt: string;
  endAt: string;
  duration: number;
  startedAt: string | null;
  endedAt: string | null;
  maxAttendees: number | null;
  preEventText: string | null;
  postEventText: string | null;
  previousEventId: string | null;
  createdAt: string;
  updatedAt: string;
  config?: EventConfig;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  eventType?: EventType;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  startAt: string;
  duration: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  eventType?: EventType;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  startAt?: string;
  duration?: number;
  maxAttendees?: number | null;
  preEventText?: string;
  postEventText?: string;
  previousEventId?: string;
}

export interface UpdateEventStatusDto {
  status: EventStatus;
}

export interface UpdateEventConfigDto {
  attendeesPublic?: boolean;
  chatEnabled?: boolean;
  mediaEnabled?: boolean;
  prizesEnabled?: boolean;
}
