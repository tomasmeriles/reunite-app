import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '~/hooks/api/use-notifications';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '~/api/notifications/notifications.types';

let socket: Socket | null = null;

export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('notifications');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = getAuthToken();
    if (!token) return;

    socket = io(`${window.location.origin}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification', (notification: AppNotification) => {
      // Update cache
      queryClient.invalidateQueries({
        queryKey: notificationKeys(),
      });

      // Show toast with translated content
      const title = notification.title.includes(':') 
        ? String(t(notification.title, notification.data || {}))
        : notification.title;
      const message = notification.message.includes(':') 
        ? String(t(notification.message, notification.data || {}))
        : notification.message;
      toast(title, {
        description: message,
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Notification socket error:', err.message);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, []);
}

function getAuthToken(): string {
  // Get token from cookie or localStorage (same as axios interceptor)
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match && match[1] ? decodeURIComponent(match[1]) : '';
}
