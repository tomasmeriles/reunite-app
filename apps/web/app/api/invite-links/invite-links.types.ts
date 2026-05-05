export interface InviteLink {
  id: string;
  eventId: string;
  token: string;
  label: string | null;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateInviteLinkDto {
  label?: string;
  maxUses?: number;
  expiresAt?: string;
}

export interface ResolveInviteLinkEvent {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  location: string | null;
  timezone: string;
  startDate: string;
  endDate: string;
  maxAttendees: number | null;
}

export interface ResolveInviteLinkResponse {
  event: ResolveInviteLinkEvent;
  link: Pick<InviteLink, 'label' | 'expiresAt' | 'maxUses' | 'useCount'>;
}

export interface ResolveInviteLinkError {
  reason:
    | 'draft'
    | 'event_type_changed'
    | 'expired'
    | 'max_uses_reached'
    | 'registrations_closed'
    | 'unavailable';
  event: ResolveInviteLinkEvent;
  link: Pick<InviteLink, 'label' | 'expiresAt' | 'maxUses' | 'useCount'>;
}
