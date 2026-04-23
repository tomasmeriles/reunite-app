import { apiClient } from '~/lib/axios';
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

  unregister: (eventId: string, guestToken?: string) =>
    apiClient
      .delete(`/events/${eventId}/attendees/me`, {
        headers: guestToken ? { 'x-guest-token': guestToken } : {},
      })
      .then((r) => r.data),

  getAttendees: (eventId: string) =>
    apiClient
      .get<EventAttendee[]>(`/events/${eventId}/attendees`)
      .then((r) => r.data),

  getMyAttendance: (eventId: string, guestToken?: string) =>
    apiClient
      .get<EventAttendee | null>(`/events/${eventId}/attendees/me`, {
        headers: guestToken ? { 'x-guest-token': guestToken } : {},
      })
      .then((r) => r.data),
};
