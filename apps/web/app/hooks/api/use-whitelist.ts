import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whitelistApi } from '~/api/whitelist/whitelist.api';
import type { AddToWhitelistDto } from '~/api/whitelist/whitelist.types';

export const whitelistKeys = {
  byEvent: (eventId: string) => ['whitelist', eventId] as const,
};

export function useWhitelist(eventId: string) {
  return useQuery({
    queryKey: whitelistKeys.byEvent(eventId),
    queryFn: () => whitelistApi.getByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useAddToWhitelist(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddToWhitelistDto) => whitelistApi.add(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: whitelistKeys.byEvent(eventId),
      });
    },
  });
}

export function useRemoveFromWhitelist(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => whitelistApi.remove(eventId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: whitelistKeys.byEvent(eventId),
      });
    },
  });
}
