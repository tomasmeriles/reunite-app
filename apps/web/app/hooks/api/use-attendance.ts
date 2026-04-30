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
      // Populate myAttendance immediately from the registration response.
      // Avoids a race where the refetch runs before localStorage has the
      // guestToken, which would cause the query to return null.
      queryClient.setQueryData(attendanceKeys.mine(eventId), data);
      // exact: true — attendees key ['attendance', eventId] is a prefix of
      // mine key ['attendance', eventId, 'me'], so without exact the mine
      // query gets invalidated and refetched with a stale guestToken.
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
        exact: true,
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

export function useAddGuest(eventId: string) {
  const queryClient = useQueryClient();
  const guestToken =
    typeof window !== 'undefined'
      ? (localStorage.getItem(`guest_token_${eventId}`) ?? undefined)
      : undefined;
  return useMutation({
    mutationFn: (guestName: string) =>
      attendanceApi.addGuest(eventId, guestName, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendees(eventId),
      });
    },
  });
}
