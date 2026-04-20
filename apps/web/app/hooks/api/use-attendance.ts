import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '~/api/attendance/attendance.api';
import type { RegisterAttendeeDto } from '~/api/attendance/attendance.types';

export const attendanceKeys = {
  attendees: (eventId: string) => ['attendance', eventId] as const,
};

export function useAttendees(eventId: string) {
  return useQuery({
    queryKey: attendanceKeys.attendees(eventId),
    queryFn: () => attendanceApi.getAttendees(eventId),
    enabled: !!eventId,
  });
}

export function useRegisterAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterAttendeeDto) =>
      attendanceApi.register(eventId, dto),
    onSuccess: (data) => {
      // Store guest token in localStorage for future requests
      if (data.guestToken) {
        localStorage.setItem(`guest_token_${eventId}`, data.guestToken);
      }
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
      });
    },
  });
}

export function useUnregisterAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.unregister(eventId),
    onSuccess: () => {
      localStorage.removeItem(`guest_token_${eventId}`);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
      });
    },
  });
}
