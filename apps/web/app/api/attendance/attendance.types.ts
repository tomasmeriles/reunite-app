export type AttendeeStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string | null;
  guestName: string | null;
  addedById: string | null;
  status: AttendeeStatus;
  registeredAt: string;
  user?: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
  sponsoredBy?: {
    id: string;
    guestName: string | null;
    user: { name: string | null; username: string } | null;
  } | null;
  inviteLink?: { maxUses: number | null; useCount: number } | null;
}

export interface RegisterAttendeeDto {
  guestName?: string;
  inviteToken?: string;
}

export interface RegisterAttendeeResponse extends EventAttendee {
  /** Only present when attendee is a guest (no account) */
  guestToken?: string;
}
