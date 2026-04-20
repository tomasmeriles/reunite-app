import { apiClient } from '~/lib/axios';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  UpdateEventConfigDto,
} from './events.types';

export const eventsApi = {
  create: (dto: CreateEventDto) =>
    apiClient.post<Event>('/events', dto).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Event>(`/events/${id}`).then((r) => r.data),

  getMine: () => apiClient.get<Event[]>('/events/mine').then((r) => r.data),

  getPublic: () => apiClient.get<Event[]>('/events/public').then((r) => r.data),

  update: (id: string, dto: UpdateEventDto) =>
    apiClient.patch<Event>(`/events/${id}`, dto).then((r) => r.data),

  updateStatus: (id: string, dto: UpdateEventStatusDto) =>
    apiClient.patch<Event>(`/events/${id}/status`, dto).then((r) => r.data),

  updateConfig: (id: string, dto: UpdateEventConfigDto) =>
    apiClient.patch<Event>(`/events/${id}/config`, dto).then((r) => r.data),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<{ coverImage: string }>(`/events/${id}/cover`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  delete: (id: string) => apiClient.delete(`/events/${id}`).then((r) => r.data),
};
