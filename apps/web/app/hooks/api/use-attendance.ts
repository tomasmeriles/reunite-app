import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { attendanceApi } from '~/api/attendance/attendance.api';
import type { RegisterAttendeeDto } from '~/api/attendance/attendance.types';

const PAGE_SIZE = 20;

export const attendanceKeys = {
  attendeesPaged: (eventId: string) =>
    ['attendance', eventId, 'paged'] as const,
  mine: (eventId: string) => ['attendance', eventId, 'me'] as const,
};

export function useAttendeesInfinite(eventId: string, search?: string, guestToken?: string | null) {
  return useInfiniteQuery({
    queryKey: [...attendanceKeys.attendeesPaged(eventId), search ?? '', guestToken ?? ''] as const,
    queryFn: ({ pageParam = 1 }) =>
      attendanceApi.getAttendees(eventId, pageParam as number, PAGE_SIZE, search, guestToken ?? undefined),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
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
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendeesPaged(eventId),
      });
    },
  });
}

export function useUnregisterAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => {
      const guestToken =
        localStorage.getItem(`guest_token_${eventId}`) ?? undefined;
      return attendanceApi.unregister(eventId, guestToken, reason);
    },
    onSuccess: () => {
      localStorage.removeItem(`guest_token_${eventId}`);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendeesPaged(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.mine(eventId),
      });
    },
  });
}

export function useAllAttendeesInfinite(eventId: string, search?: string) {
  return useInfiniteQuery({
    queryKey: ['attendance', eventId, 'all', search ?? ''] as const,
    queryFn: ({ pageParam = 1 }) =>
      attendanceApi.getAllAttendees(eventId, pageParam as number, PAGE_SIZE, search),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
    enabled: !!eventId,
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
        queryKey: attendanceKeys.attendeesPaged(eventId),
      });
    },
  });
}

export function useRemoveAttendee(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attendeeId: string) =>
      attendanceApi.removeAttendee(eventId, attendeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.attendeesPaged(eventId),
      });
    },
  });
}
