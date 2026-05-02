import { CalendarDays, Clock, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Modal, ModalFooter } from '~/components/ui/modal';
import { FormContainer, FormDateTimeField, FormTimeField } from '~/components/forms';
import { LoadingButton } from '~/components/buttons';
import { useUpdateEvent } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import { getSystemTimezone, formatDateTime } from '~/lib/datetime';
import {
  updateEventSchema,
  toApiPayload,
  eventToFormDefaults,
  type UpdateEventFormValues,
} from '~/lib/schemas/event.schema';
import type { Event } from '~/api/events/events.types';

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  event: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

function WhenEditForm({ event, onSuccess, onCancel }: EditFormProps) {
  const apiError = useApiError();
  const { mutate: updateEvent, isPending } = useUpdateEvent(event.id);

  const form = useForm<UpdateEventFormValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: eventToFormDefaults(event),
  });

  const { isDirty } = form.formState;

  const onSubmit = (values: UpdateEventFormValues) => {
    updateEvent(toApiPayload(values), {
      onSuccess: () => {
        toast.success('Event dates updated');
        onSuccess();
      },
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <FormContainer form={form} onSubmit={onSubmit}>
      {event.status === 'PUBLISHED' && (
        <Alert variant="warning" className="mb-2">
          <Info className="size-4" />
          <AlertDescription>
            Changing the start date will automatically mark this event as{' '}
            <strong>Rescheduled</strong> and notify attendees.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
        <FormDateTimeField
          control={form.control}
          name="startAt"
          label="Start date & time"
          disablePast
        />
        <FormTimeField
          control={form.control}
          name="duration"
          label="Duration"
          maxHours={99}
        />
      </div>
      <ModalFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isPending}
          loadingText="Saving…"
          disabled={!isDirty}
        >
          Save changes
        </LoadingButton>
      </ModalFooter>
    </FormContainer>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface WhenCardProps {
  event: Event;
}

export function WhenCard({ event }: WhenCardProps) {
  const { canEdit } = useEventAccess(event.id);
  const tz = event.timezone ?? getSystemTimezone();
  const durationHours = Math.floor(event.duration / 60);
  const durationMinutes = event.duration % 60;
  const durationLabel =
    durationHours > 0
      ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
      : `${durationMinutes}m`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>When</CardTitle>
          <CardDescription>Start date, time, and duration</CardDescription>
        </div>
        {canEdit && (
          <Modal
            title="When"
            description="Update the event's start date, time, and duration"
            trigger={
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit dates</span>
              </Button>
            }
          >
            {({ close }) => (
              <WhenEditForm event={event} onSuccess={close} onCancel={close} />
            )}
          </Modal>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">From </span>
            {formatDateTime(event.startAt, 'd LLL yyyy, HH:mm', tz)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">Duration </span>
            {durationLabel}
          </span>
        </div>
        {event.timezone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-transparent" />
            {event.timezone}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
