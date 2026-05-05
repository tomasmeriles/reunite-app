import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '~/api/notifications/notifications.api';
import type { AppNotification } from '~/api/notifications/notifications.types';

export function notificationKeys() {
  return ['notifications'] as const;
}

export function notificationKeysList(unreadOnly?: boolean) {
  return [...notificationKeys(), 'list', { unreadOnly }] as const;
}

export function notificationKeysUnreadCount() {
  return [...notificationKeys(), 'unreadCount'] as const;
}

export function useNotifications(unreadOnly?: boolean) {
  return useQuery<AppNotification[]>({
    queryKey: notificationKeysList(unreadOnly),
    queryFn: () => notificationsApi.list(unreadOnly),
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: notificationKeysUnreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys() });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys() });
    },
  });
}
