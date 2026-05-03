import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '~/api/events/events.api';
import { authKeys } from '~/hooks/api/use-auth';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  UpdateEventConfigDto,
} from '~/api/events/events.types';

export const eventKeys = {
  all: () => ['events'] as const,
  mine: () => ['events', 'mine'] as const,
  public: () => ['events', 'public'] as const,
  detail: (id: string) => ['events', id] as const,
};

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: eventKeys.mine(),
    queryFn: () => eventsApi.getMine(),
  });
}

export function usePublicEvents() {
  return useQuery({
    queryKey: eventKeys.public(),
    queryFn: () => eventsApi.getPublic(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEventDto) => eventsApi.create(dto),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: eventKeys.mine() });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateEventDto) => eventsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
  });
}

export function useUpdateEventStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateEventStatusDto) => eventsApi.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.mine() });
    },
  });
}

export function useUpdateEventConfig(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateEventConfigDto) => eventsApi.updateConfig(id, dto),
    onSuccess: () => {
      // Invalidate the event so attendee config-gated permissions update
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      // Invalidate /auth/me so CASL abilities rebuild with new config gates
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useUploadEventCover(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => eventsApi.uploadCover(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.mine() });
    },
  });
}
