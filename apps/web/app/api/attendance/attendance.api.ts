import { apiClient } from '~/lib/axios';
import type { Page } from '~/lib/types';
import type {
  EventAttendee,
  RegisterAttendeeDto,
  RegisterAttendeeResponse,
} from './attendance.types';

export const attendanceApi = {
  register: (eventId: string, dto: RegisterAttendeeDto) =>
    apiClient
      .post<RegisterAttendeeResponse>(`/events/${eventId}/attendees`, dto)
      .then((r) => r.data),

  unregister: (eventId: string, guestToken?: string, reason?: string) =>
    apiClient
      .delete(`/events/${eventId}/attendees/me`, {
        headers: guestToken ? { 'x-guest-token': guestToken } : {},
        data: reason ? { reason } : undefined,
      })
      .then((r) => r.data),

  getAllAttendees: (eventId: string, page = 1, limit = 20, search?: string) =>
    apiClient
      .get<Page<EventAttendee>>(`/events/${eventId}/attendees/all`, {
        params: { page, limit, ...(search ? { search } : {}) },
      })
      .then((r) => r.data),

  getAttendees: (eventId: string, page = 1, limit = 20, search?: string) =>
    apiClient
      .get<Page<EventAttendee>>(`/events/${eventId}/attendees`, {
        params: { page, limit, ...(search ? { search } : {}) },
      })
      .then((r) => r.data),

  getMyAttendance: (eventId: string, guestToken?: string) =>
    apiClient
      .get<EventAttendee | null>(`/events/${eventId}/attendees/me`, {
        headers: guestToken ? { 'x-guest-token': guestToken } : {},
      })
      .then((r) => r.data),

  addGuest: (eventId: string, guestName: string, guestToken?: string) =>
    apiClient
      .post<RegisterAttendeeResponse>(
        `/events/${eventId}/attendees/bring-guest`,
        { guestName },
        { headers: guestToken ? { 'x-guest-token': guestToken } : {} },
      )
      .then((r) => r.data),

  removeAttendee: (eventId: string, attendeeId: string) =>
    apiClient
      .delete(`/events/${eventId}/attendees/${attendeeId}`)
      .then((r) => r.data),
};
