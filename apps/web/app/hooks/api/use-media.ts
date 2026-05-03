import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '~/api/media/media.api';

const PAGE_SIZE = 20;

export const mediaKeys = {
  byEvent: (eventId: string, guestToken?: string | null) =>
    ['media', eventId, guestToken ?? ''] as const,
};

export function useMediaInfinite(eventId: string, guestToken?: string | null) {
  return useInfiniteQuery({
    queryKey: mediaKeys.byEvent(eventId, guestToken),
    queryFn: ({ pageParam = 1 }) =>
      mediaApi.getByEvent(eventId, pageParam as number, PAGE_SIZE, guestToken),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
    enabled: !!eventId,
  });
}

export function useUploadMedia(eventId: string, guestToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaApi.upload(eventId, file, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', eventId] });
    },
  });
}

export function useDeleteMedia(eventId: string, guestToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) =>
      mediaApi.delete(eventId, mediaId, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', eventId] });
    },
  });
}
