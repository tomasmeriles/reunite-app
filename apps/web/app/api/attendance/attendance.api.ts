import { apiClient } from '~/lib/axios';
import type {
  EventAttendee,
  RegisterAttendeeDto,
  RegisterAttendeeResponse,
} from './attendance.types';

export const attendanceApi = {
  register: (eventId: string, dto: RegisterAttendeeDto) =>
    apiClient
      .post<RegisterAttendeeResponse>(`/events/${eventId}/attendance`, dto, {
        eventId,
      } as object)
      .then((r) => r.data),

  unregister: (eventId: string) =>
    apiClient
      .delete(`/events/${eventId}/attendance`, { eventId } as object)
      .then((r) => r.data),

  getAttendees: (eventId: string) =>
    apiClient
      .get<EventAttendee[]>(`/events/${eventId}/attendance`, {
        eventId,
      } as object)
      .then((r) => r.data),
};
