import { apiClient } from '~/lib/axios';
import type { Prize, CreatePrizeDto, AssignWinnerDto } from './prizes.types';

export const prizesApi = {
  create: (eventId: string, dto: CreatePrizeDto) =>
    apiClient.post<Prize>(`/events/${eventId}/prizes`, dto).then((r) => r.data),

  getByEvent: (eventId: string) =>
    apiClient.get<Prize[]>(`/events/${eventId}/prizes`).then((r) => r.data),

  assignWinner: (eventId: string, prizeId: string, dto: AssignWinnerDto = {}) =>
    apiClient
      .patch<Prize>(`/events/${eventId}/prizes/${prizeId}/winner`, dto)
      .then((r) => r.data),

  delete: (eventId: string, prizeId: string) =>
    apiClient
      .delete(`/events/${eventId}/prizes/${prizeId}`)
      .then((r) => r.data),
};
