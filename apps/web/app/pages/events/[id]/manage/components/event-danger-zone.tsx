import { Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { ConfirmModal } from '~/components/ui/modal';
import { useDeleteEvent } from '~/hooks/api/use-events';
import { useApiError } from '~/hooks/use-api-error';
import type { Event, EventStatus } from '~/api/events/events.types';

interface EventDangerZoneProps {
  event: Event;
}

export function EventDangerZone({ event }: EventDangerZoneProps) {
  const { t } = useTranslation('events');
  const apiError = useApiError();
  const navigate = useNavigate();
  const { mutate: deleteEvent, isPending } = useDeleteEvent();

  const handleDelete = () => {
    deleteEvent(event.id, {
      onSuccess: () => {
        toast.success(t('manage.danger.deleteSuccess'));
        void navigate({ to: '/dashboard' });
      },
      onError: (err) => toast.error(apiError(err)),
    });
  };

  const BLOCKED_REASONS: Partial<Record<EventStatus, string>> = {
    PUBLISHED: t('manage.danger.blockedPublished'),
    RESCHEDULED: t('manage.danger.blockedPublished'),
    ACTIVE: t('manage.danger.blockedActive'),
    ENDED: t('manage.danger.blockedEnded'),
  };

  const blockedReason = BLOCKED_REASONS[event.status];
  const canDelete = !blockedReason;

  const confirmDescription =
    event.status === 'CANCELLED'
      ? t('manage.danger.deleteDescCancelled', { title: event.title })
      : t('manage.danger.deleteDescNormal', { title: event.title });

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{t('manage.danger.title')}</CardTitle>
        <CardDescription>{t('manage.danger.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('manage.danger.delete')}</p>
            <p className="text-xs text-muted-foreground">
              {t('manage.danger.deleteSubtitle')}
            </p>
          </div>
          {canDelete ? (
            <ConfirmModal
              title={t('manage.danger.deleteTitle')}
              description={confirmDescription}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  className="shrink-0"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {t('manage.danger.delete')}
                </Button>
              }
              confirmLabel={t('manage.danger.deleteConfirmLabel')}
              variant="destructive"
              onConfirm={handleDelete}
              isLoading={isPending}
            />
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled
              className="shrink-0"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t('manage.danger.delete')}
            </Button>
          )}
        </div>
        {blockedReason && (
          <Alert variant="info" className="mt-3">
            <Info className="size-4" />
            <AlertDescription>{blockedReason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
