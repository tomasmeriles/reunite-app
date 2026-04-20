import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prizesApi } from '~/api/prizes/prizes.api';
import type {
  CreatePrizeDto,
  AssignWinnerDto,
} from '~/api/prizes/prizes.types';

export const prizeKeys = {
  byEvent: (eventId: string) => ['prizes', eventId] as const,
};

export function usePrizes(eventId: string) {
  return useQuery({
    queryKey: prizeKeys.byEvent(eventId),
    queryFn: () => prizesApi.getByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreatePrize(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePrizeDto) => prizesApi.create(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prizeKeys.byEvent(eventId) });
    },
  });
}

export function useAssignWinner(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prizeId,
      dto,
    }: {
      prizeId: string;
      dto?: AssignWinnerDto;
    }) => prizesApi.assignWinner(eventId, prizeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prizeKeys.byEvent(eventId) });
    },
  });
}

export function useDeletePrize(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prizeId: string) => prizesApi.delete(eventId, prizeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prizeKeys.byEvent(eventId) });
    },
  });
}
