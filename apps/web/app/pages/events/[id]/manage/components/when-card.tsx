import { CalendarDays, Clock, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const { t } = useTranslation(['events', 'common']);
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
        toast.success(t('events:manage.when.updateSuccess'));
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
            {t('events:manage.when.rescheduledWarning')}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 sm:items-end">
        <FormDateTimeField
          control={form.control}
          name="startAt"
          label={t('events:create.fields.startDate')}
          disablePast
        />
        <FormTimeField
          control={form.control}
          name="duration"
          label={t('events:create.fields.duration')}
          maxHours={99}
        />
      </div>
      <ModalFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isPending}
          loadingText={t('common:actions.saving')}
          disabled={!isDirty}
        >
          {t('common:actions.save')}
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
  const { t } = useTranslation('events');
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
          <CardTitle>{t('manage.when.title')}</CardTitle>
          <CardDescription>{t('manage.when.description')}</CardDescription>
        </div>
        {canEdit && (
          <Modal
            title={t('manage.when.title')}
            description={t('manage.when.description')}
            trigger={
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <Pencil className="h-3.5 w-3.5" />
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
            <span className="text-muted-foreground">{t('manage.when.from')} </span>
            {formatDateTime(event.startAt, 'd LLL yyyy, HH:mm', tz)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">{t('manage.when.duration')} </span>
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
