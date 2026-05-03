import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { SplitButton } from '~/components/buttons';
import { ConfirmModal } from '~/components/ui/modal';
import { useUpdateEventStatus } from '~/hooks/api/use-events';
import { useApiError } from '~/hooks/use-api-error';
import {
  STATUS_META,
  getPrimaryTransition,
  getSecondaryTransitions,
  type StatusTransition,
} from '~/lib/event-state-machine';
import type { Event, EventStatus } from '~/api/events/events.types';

const PUBLISH_STATUSES: EventStatus[] = ['DRAFT', 'RESCHEDULED'];

interface EventStatusCardProps {
  event: Event;
}

export function EventStatusCard({ event }: EventStatusCardProps) {
  const { t } = useTranslation(['events', 'common']);
  const apiError = useApiError();
  const { mutate: updateStatus, isPending } = useUpdateEventStatus(event.id);
  const [pendingTransition, setPendingTransition] =
    useState<StatusTransition | null>(null);

  const handleStatusChange = (status: EventStatus) => {
    updateStatus(
      { status },
      {
        onSuccess: () => toast.success(t(`common:status.${status}`)),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const handleSelect = (status: EventStatus) => {
    const allTransitions = [
      getPrimaryTransition(event.status),
      ...getSecondaryTransitions(event.status),
    ].filter(Boolean) as StatusTransition[];

    const transition = allTransitions.find((tr) => tr.to === status);
    if (transition?.requiresConfirmation) {
      setPendingTransition(transition);
    } else {
      handleStatusChange(status);
    }
  };

  const statusMeta = STATUS_META[event.status];
  const primaryTransition = getPrimaryTransition(event.status);
  const secondaryTransitions = getSecondaryTransitions(event.status);

  const startInPast =
    PUBLISH_STATUSES.includes(event.status) &&
    new Date(event.startAt) <= new Date();

  const effectivePrimary =
    startInPast && primaryTransition?.to === 'PUBLISHED'
      ? null
      : primaryTransition;
  const effectiveSecondary = startInPast
    ? secondaryTransitions.filter((tr) => tr.to !== 'PUBLISHED')
    : secondaryTransitions;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('events:manage.settings.title')}</CardTitle>
          <CardDescription>{t(`events:statusMeta.${event.status}.description`)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {startInPast && (
            <Alert variant="warning">
              <CalendarClock className="size-4" />
              <AlertDescription>
                {t('events:manage.settings.startInPast', {
                  defaultValue: 'Start date is in the past. Update the event date before publishing.',
                })}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className={`px-3 py-1 text-sm ${statusMeta.colorClass}`}>
                {t(`common:status.${event.status}`)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t(statusMeta.descriptionKey, { ns: 'events' })}
              </span>
            </div>
            {effectivePrimary ? (
              <SplitButton<EventStatus>
                primary={{
                  value: effectivePrimary.to,
                  label: t(effectivePrimary.labelKey, { ns: 'events' }),
                  variant: effectivePrimary.variant,
                }}
                options={effectiveSecondary.map((tr) => ({
                  value: tr.to,
                  label: t(tr.labelKey, { ns: 'events' }),
                  description: t(tr.descriptionKey, { ns: 'events' }),
                  variant: tr.variant,
                  separator: tr.variant === 'destructive',
                }))}
                onSelect={handleSelect}
                isLoading={isPending}
              />
            ) : (
              <span className="text-sm italic text-muted-foreground">
                {t('events:manage.noTransitions', {
                  defaultValue: 'No further transitions available',
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {pendingTransition?.requiresConfirmation && (
        <ConfirmModal
          open={!!pendingTransition}
          onOpenChange={(open) => !open && setPendingTransition(null)}
          title={t(pendingTransition.requiresConfirmation.titleKey, { ns: 'events' })}
          description={t(pendingTransition.requiresConfirmation.descriptionKey, { ns: 'events' })}
          confirmLabel={t('common:actions.confirm')}
          variant={pendingTransition.variant === 'destructive' ? 'destructive' : 'default'}
          onConfirm={() => {
            handleStatusChange(pendingTransition.to);
            setPendingTransition(null);
          }}
          isLoading={isPending}
        />
      )}
    </>
  );
}
