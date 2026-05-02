import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';
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

function getStatusChangeMessage(status: EventStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Event is now a draft. It will not be visible to attendees.';
    case 'PUBLISHED':
      return 'Event is now published. Attendees can view and join the event.';
    case 'CANCELLED':
      return 'Event is canceled. Attendees will be notified and cannot join.';
    case 'RESCHEDULED':
      return 'Event is rescheduled. Attendees will be notified with the new details.';
    case 'ACTIVE':
      return 'Event is now active. Attendees can join the event.';
    case 'ENDED':
      return 'Event has ended. It will be archived and read-only.';
  }
}

export function EventStatusCard({ event }: EventStatusCardProps) {
  const apiError = useApiError();
  const { mutate: updateStatus, isPending } = useUpdateEventStatus(event.id);
  const [pendingTransition, setPendingTransition] =
    useState<StatusTransition | null>(null);

  const handleStatusChange = (status: EventStatus) => {
    updateStatus(
      { status },
      {
        onSuccess: () => toast.success(getStatusChangeMessage(status)),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const handleSelect = (status: EventStatus) => {
    const allTransitions = [
      getPrimaryTransition(event.status),
      ...getSecondaryTransitions(event.status),
    ].filter(Boolean) as StatusTransition[];

    const transition = allTransitions.find((t) => t.to === status);
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

  // When startAt is in the past, filter out PUBLISHED transitions so the
  // SplitButton doesn't surface an action that will be rejected by the backend.
  const effectivePrimary =
    startInPast && primaryTransition?.to === 'PUBLISHED'
      ? null
      : primaryTransition;
  const effectiveSecondary = startInPast
    ? secondaryTransitions.filter((t) => t.to !== 'PUBLISHED')
    : secondaryTransitions;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Event status</CardTitle>
          <CardDescription>Control the lifecycle of your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {startInPast && (
            <Alert variant="warning">
              <CalendarClock className="size-4" />
              <AlertDescription>
                Start date is in the past. Update the event date before publishing.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className={`px-3 py-1 text-sm ${statusMeta.colorClass}`}>
                {statusMeta.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {statusMeta.description}
              </span>
            </div>
            {effectivePrimary ? (
              <SplitButton<EventStatus>
                primary={{
                  value: effectivePrimary.to,
                  label: effectivePrimary.label,
                  variant: effectivePrimary.variant,
                }}
                options={effectiveSecondary.map((t) => ({
                  value: t.to,
                  label: t.label,
                  description: t.description,
                  variant: t.variant,
                  separator: t.variant === 'destructive',
                }))}
                onSelect={handleSelect}
                isLoading={isPending}
              />
            ) : (
              <span className="text-sm italic text-muted-foreground">
                No further transitions available
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {pendingTransition?.requiresConfirmation && (
        <ConfirmModal
          open={!!pendingTransition}
          onOpenChange={(open) => !open && setPendingTransition(null)}
          title={pendingTransition.requiresConfirmation.title}
          description={pendingTransition.requiresConfirmation.description}
          confirmLabel="Confirm"
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
