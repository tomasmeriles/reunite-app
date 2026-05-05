import { apiClient } from '~/lib/axios';
import type { WhitelistEntry, AddToWhitelistDto } from './whitelist.types';

export const whitelistApi = {
  add: (eventId: string, dto: AddToWhitelistDto) =>
    apiClient
      .post<WhitelistEntry>(`/events/${eventId}/whitelist`, dto)
      .then((r) => r.data),

  getByEvent: (eventId: string) =>
    apiClient
      .get<WhitelistEntry[]>(`/events/${eventId}/whitelist`)
      .then((r) => r.data),

  remove: (eventId: string, userId: string) =>
    apiClient
      .delete(`/events/${eventId}/whitelist/${userId}`)
      .then((r) => r.data),
};
