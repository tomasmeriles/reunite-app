import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';
import type { AppNotification } from '~/api/notifications/notifications.types';
import { CalendarClock, CalendarX, Radio } from 'lucide-react';
import { formatDateTime } from '~/lib/datetime';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EVENT_RESCHEDULED: CalendarClock,
  EVENT_CANCELLED: CalendarX,
  EVENT_LIVE: Radio,
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const { t } = useTranslation(['notifications', 'common']);
  const Icon = ICONS[notification.type] || CalendarClock;

  const handleClick = () => {
    if (!notification.readAt) {
      onRead();
    }
  };

  // Translate title and message if they are i18n keys
  const title = notification.title.includes(':')
    ? String(t(notification.title, notification.data || {}))
    : notification.title;

  const dataWithFormattedDates = {
    ...notification.data,
    ...(notification.data?.newDate && { newDate: formatDateTime(notification.data.newDate) }),
    ...(notification.data?.oldDate && { oldDate: formatDateTime(notification.data.oldDate) }),
  };

  const message = notification.message.includes(':')
    ? String(t(notification.message, dataWithFormattedDates || {}))
    : notification.message;

  return (
    <div
      className={cn(
        'cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50',
        !notification.readAt && 'bg-muted/30',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">
            {title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!notification.readAt && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}
