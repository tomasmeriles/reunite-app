import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '~/api/media/media.api';

export const mediaKeys = {
  byEvent: (eventId: string) => ['media', eventId] as const,
};

export function useMedia(eventId: string) {
  return useQuery({
    queryKey: mediaKeys.byEvent(eventId),
    queryFn: () => mediaApi.getByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useUploadMedia(eventId: string, guestToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaApi.upload(eventId, file, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.byEvent(eventId) });
    },
  });
}

export function useDeleteMedia(eventId: string, guestToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) =>
      mediaApi.delete(eventId, mediaId, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.byEvent(eventId) });
    },
  });
}
