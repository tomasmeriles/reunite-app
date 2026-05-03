import { apiClient } from '~/lib/axios';
import type { Page } from '~/lib/types';
import type { MediaItem, UploadMediaResponse } from './media.types';

export const mediaApi = {
  upload: (eventId: string, file: File, guestToken?: string | null) => {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (guestToken) headers['x-guest-token'] = guestToken;
    return apiClient
      .post<UploadMediaResponse>(`/events/${eventId}/media`, form, { headers })
      .then((r) => r.data);
  },

  getByEvent: (eventId: string, page = 1, limit = 20, guestToken?: string | null) =>
    apiClient
      .get<Page<MediaItem>>(`/events/${eventId}/media`, {
        params: { page, limit },
        headers: guestToken ? { 'x-guest-token': guestToken } : {},
      })
      .then((r) => r.data),

  delete: (eventId: string, mediaId: string, guestToken?: string | null) => {
    const headers: Record<string, string> = {};
    if (guestToken) headers['x-guest-token'] = guestToken;
    return apiClient
      .delete(`/events/${eventId}/media/${mediaId}`, { headers })
      .then((r) => r.data);
  },
};
