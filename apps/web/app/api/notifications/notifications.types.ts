export type NotificationType = 'EVENT_RESCHEDULED' | 'EVENT_CANCELLED' | 'EVENT_LIVE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}
