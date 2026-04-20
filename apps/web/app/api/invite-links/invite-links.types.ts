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

export interface ResolveInviteLinkResponse {
  valid: boolean;
  event: {
    id: string;
    title: string;
    startDate: string;
    coverImage: string | null;
  };
  link: Pick<InviteLink, 'label' | 'expiresAt' | 'maxUses' | 'useCount'>;
}
