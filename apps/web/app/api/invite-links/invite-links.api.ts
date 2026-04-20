import { apiClient } from '~/lib/axios';
import type {
  InviteLink,
  CreateInviteLinkDto,
  ResolveInviteLinkResponse,
} from './invite-links.types';

export const inviteLinksApi = {
  create: (eventId: string, dto: CreateInviteLinkDto) =>
    apiClient
      .post<InviteLink>(`/events/${eventId}/invite-links`, dto)
      .then((r) => r.data),

  getByEvent: (eventId: string) =>
    apiClient
      .get<InviteLink[]>(`/events/${eventId}/invite-links`)
      .then((r) => r.data),

  resolve: (token: string) =>
    apiClient
      .get<ResolveInviteLinkResponse>(`/invite-links/${token}`)
      .then((r) => r.data),

  delete: (eventId: string, linkId: string) =>
    apiClient
      .delete(`/events/${eventId}/invite-links/${linkId}`)
      .then((r) => r.data),
};
