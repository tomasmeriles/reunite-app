import { useEffect } from 'react';
import { MapPin, Clock, Pencil } from 'lucide-react';
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
import { Modal, ModalFooter } from '~/components/ui/modal';
import { GoogleMap } from '~/components/ui/google-map';
import { FormContainer, FormLocationField } from '~/components/forms';
import { LoadingButton } from '~/components/buttons';
import { useUpdateEvent } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useLocationPicker } from '~/hooks/use-location-picker';
import { useApiError } from '~/hooks/use-api-error';
import { updateEventSchema, toApiPayload, eventToFormDefaults, type UpdateEventFormValues } from '~/lib/schemas/event.schema';
import type { Event } from '~/api/events/events.types';

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  event: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

function WhereEditForm({ event, onSuccess, onCancel }: EditFormProps) {
  const { t } = useTranslation(['events', 'common']);
  const apiError = useApiError();
  const { mutate: updateEvent, isPending } = useUpdateEvent(event.id);
  const picker = useLocationPicker();

  const form = useForm<UpdateEventFormValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: eventToFormDefaults(event),
  });

  const { isDirty } = form.formState;
  const watched = form.watch();

  useEffect(() => {
    if (event.location) picker.setQuery(event.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (values: UpdateEventFormValues) => {
    updateEvent(toApiPayload(values), {
      onSuccess: () => {
        toast.success(t('events:manage.where.updateSuccess'));
        onSuccess();
      },
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <FormContainer form={form} onSubmit={onSubmit}>
      <div className="space-y-4 py-2">
        <FormLocationField
          control={form.control}
          name="location"
          picker={picker}
          latName="latitude"
          lngName="longitude"
          timezoneName="timezone"
          addressName="address"
          cityName="city"
          stateName="state"
          countryName="country"
          placeIdName="placeId"
          label={t('events:create.fields.location')}
          optional
        />
        {picker.selected && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[picker.selected.city, picker.selected.state, picker.selected.country]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {watched.timezone && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {watched.timezone}
          </p>
        )}
        {picker.selected && (
          <GoogleMap
            lat={picker.selected.lat}
            lng={picker.selected.lng}
            className="h-40 overflow-hidden rounded-lg"
          />
        )}
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

interface WhereCardProps {
  event: Event;
}

export function WhereCard({ event }: WhereCardProps) {
  const { t } = useTranslation('events');
  const { canEdit } = useEventAccess(event.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t('manage.where.title')}</CardTitle>
          <CardDescription>{t('manage.where.description')}</CardDescription>
        </div>
        {canEdit && (
          <Modal
            title={t('manage.where.title')}
            description={t('manage.where.editDescription')}
            size="md"
            trigger={
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">{t('manage.where.editLocation')}</span>
              </Button>
            }
          >
            {({ close }) => (
              <WhereEditForm event={event} onSuccess={close} onCancel={close} />
            )}
          </Modal>
        )}
      </CardHeader>
      <CardContent>
        {event.location ? (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              {event.latitude && event.longitude ? (
                <a
                  href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground transition-colors"
                >
                  {event.location}
                </a>
              ) : (
                <span className="font-medium">{event.location}</span>
              )}
              {event.address && event.address !== event.location && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.address}</p>
              )}
              {!event.address && (event.city || event.country) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[event.city, event.state, event.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('manage.where.noLocation')}</p>
        )}
      </CardContent>
    </Card>
  );
}
