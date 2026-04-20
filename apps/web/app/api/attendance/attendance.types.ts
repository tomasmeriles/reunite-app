export type AttendeeStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string | null;
  guestName: string | null;
  status: AttendeeStatus;
  registeredAt: string;
  user?: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
}

export interface RegisterAttendeeDto {
  guestName?: string;
  inviteToken?: string;
}

export interface RegisterAttendeeResponse {
  attendee: EventAttendee;
  /** Only present when attendee is a guest (no account) */
  guestToken?: string;
}
