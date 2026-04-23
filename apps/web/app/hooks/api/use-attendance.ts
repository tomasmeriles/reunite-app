import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '~/api/attendance/attendance.api';
import type { RegisterAttendeeDto } from '~/api/attendance/attendance.types';

export const attendanceKeys = {
  attendees: (eventId: string) => ['attendance', eventId] as const,
  mine: (eventId: string) => ['attendance', eventId, 'me'] as const,
};

export function useAttendees(eventId: string) {
  return useQuery({
    queryKey: attendanceKeys.attendees(eventId),
    queryFn: () => attendanceApi.getAttendees(eventId),
    enabled: !!eventId,
  });
}

export function useMyAttendance(eventId: string) {
  const guestToken =
    typeof window !== 'undefined'
      ? (localStorage.getItem(`guest_token_${eventId}`) ?? undefined)
      : undefined;
  return useQuery({
    queryKey: attendanceKeys.mine(eventId),
    queryFn: () => attendanceApi.getMyAttendance(eventId, guestToken),
    enabled: !!eventId,
  });
}

export function useRegisterAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterAttendeeDto) =>
      attendanceApi.register(eventId, dto),
    onSuccess: (data) => {
      if (data.guestToken) {
        localStorage.setItem(`guest_token_${eventId}`, data.guestToken);
      }
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.mine(eventId),
      });
    },
  });
}

export function useUnregisterAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const guestToken =
        localStorage.getItem(`guest_token_${eventId}`) ?? undefined;
      return attendanceApi.unregister(eventId, guestToken);
    },
    onSuccess: () => {
      localStorage.removeItem(`guest_token_${eventId}`);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.mine(eventId),
      });
    },
  });
}
