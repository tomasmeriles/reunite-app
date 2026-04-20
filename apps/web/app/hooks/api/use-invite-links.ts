import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inviteLinksApi } from '~/api/invite-links/invite-links.api';
import type { CreateInviteLinkDto } from '~/api/invite-links/invite-links.types';

export const inviteLinkKeys = {
  byEvent: (eventId: string) => ['invite-links', eventId] as const,
  resolve: (token: string) => ['invite-links', 'resolve', token] as const,
};

export function useInviteLinks(eventId: string) {
  return useQuery({
    queryKey: inviteLinkKeys.byEvent(eventId),
    queryFn: () => inviteLinksApi.getByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useResolveInviteLink(token: string) {
  return useQuery({
    queryKey: inviteLinkKeys.resolve(token),
    queryFn: () => inviteLinksApi.resolve(token),
    enabled: !!token,
    retry: false,
  });
}

export function useCreateInviteLink(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInviteLinkDto) =>
      inviteLinksApi.create(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inviteLinkKeys.byEvent(eventId),
      });
    },
  });
}

export function useDeleteInviteLink(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => inviteLinksApi.delete(eventId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inviteLinkKeys.byEvent(eventId),
      });
    },
  });
}
