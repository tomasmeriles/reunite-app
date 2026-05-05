import {
  Globe,
  Info,
  Link as LinkIcon,
  Users,
  Pencil,
  UserRoundCheck,
} from 'lucide-react';
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
import { Input } from '~/components/ui/input';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '~/components/ui/form';
import { Modal, ModalFooter } from '~/components/ui/modal';
import {
  FormContainer,
  FormTextField,
  FormTextareaField,
  FormCardSelectField,
} from '~/components/forms';
import { LoadingButton } from '~/components/buttons';
import { useUpdateEvent } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import {
  updateEventSchema,
  eventToFormDefaults,
  type UpdateEventFormValues,
} from '~/lib/schemas/event.schema';
import type { CardSelectOption } from '~/components/forms';
import type { Event, EventType } from '~/api/events/events.types';

const TYPE_ICON = {
  PUBLIC: Globe,
  INVITE_LINK: LinkIcon,
  INVITE_ACCOUNT: Users,
} as const;

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  event: Event;
  canEditAccess: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function AboutAccessEditForm({
  event,
  canEditAccess,
  onSuccess,
  onCancel,
}: EditFormProps) {
  const { t } = useTranslation(['events', 'common']);
  const apiError = useApiError();
  const { mutate: updateEvent, isPending } = useUpdateEvent(event.id);

  const EVENT_TYPE_OPTIONS: CardSelectOption<EventType>[] = [
    {
      value: 'PUBLIC',
      label: t('events:accessType.PUBLIC'),
      description: t('events:accessType.PUBLIC_description'),
      icon: Globe,
    },
    {
      value: 'INVITE_LINK',
      label: t('events:accessType.INVITE_LINK'),
      description: t('events:accessType.INVITE_LINK_description'),
      icon: LinkIcon,
    },
    {
      value: 'INVITE_ACCOUNT',
      label: t('events:accessType.INVITE_ACCOUNT'),
      description: t('events:accessType.INVITE_ACCOUNT_description'),
      icon: Users,
    },
  ];

  const form = useForm<UpdateEventFormValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: eventToFormDefaults(event),
  });

  const watchedEventType = form.watch('eventType');
  const { isDirty } = form.formState;
  const willBecomePrivate = watchedEventType !== 'PUBLIC';
  const guestListWillNormalize = event.config?.attendeeAccess === 'ANYONE';
  const galleryWillNormalize = event.config?.mediaAccess === 'ANYONE';
  const shouldWarnAboutAccessNormalization =
    willBecomePrivate && (guestListWillNormalize || galleryWillNormalize);

  const onSubmit = (values: UpdateEventFormValues) => {
    const { title, description, eventType, maxAttendees } = values;
    updateEvent(
      {
        title,
        description,
        ...(canEditAccess ? { eventType, maxAttendees } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t('events:manage.about.updateSuccess'));
          onSuccess();
        },
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  return (
    <FormContainer form={form} onSubmit={onSubmit}>
      <div className="space-y-4 py-2">
        <FormTextField
          control={form.control}
          name="title"
          label={t('events:create.fields.title')}
          placeholder={t('events:create.fields.titlePlaceholder')}
        />
        <FormTextareaField
          control={form.control}
          name="description"
          label={t('events:create.fields.description')}
          placeholder={t('events:create.fields.descriptionPlaceholder')}
          rows={4}
          optional
        />
        <FormCardSelectField
          control={form.control}
          name="eventType"
          label={t('events:create.fields.accessType')}
          options={EVENT_TYPE_OPTIONS}
          columns={3}
          disabled={!canEditAccess}
        />
        {shouldWarnAboutAccessNormalization && (
          <Alert variant="warning">
            <Info className="size-4" />
            <AlertDescription>
              {t('events:manage.about.privateAccessWarning', {
                targets: [
                  guestListWillNormalize
                    ? t('events:manage.about.guestList')
                    : null,
                  galleryWillNormalize
                    ? t('events:manage.about.gallery')
                    : null,
                ]
                  .filter(Boolean)
                  .join(', '),
              })}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="maxAttendees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('events:create.fields.maxAttendees')}{' '}
                <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                  optional
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  disabled={!canEditAccess}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? undefined
                        : parseInt(e.target.value, 10),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!canEditAccess && (
          <Alert variant="info">
            <Info className="size-4" />
            {t('events:manage.about.accessLocked')}
          </Alert>
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

interface AboutAccessCardProps {
  event: Event;
}

export function AboutAccessCard({ event }: AboutAccessCardProps) {
  const { t } = useTranslation('events');
  const { canEdit, canEditAccess } = useEventAccess(event.id);
  const Icon = TYPE_ICON[event.eventType];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t('manage.about.title')}</CardTitle>
          <CardDescription>{t('manage.about.description')}</CardDescription>
        </div>
        {canEdit && (
          <Modal
            title={t('manage.about.title')}
            description={t('manage.about.description')}
            trigger={
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          >
            {({ close }) => (
              <AboutAccessEditForm
                event={event}
                canEditAccess={canEditAccess}
                onSuccess={close}
                onCancel={close}
              />
            )}
          </Modal>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{event.title}</p>
          {event.description && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t(`accessType.${event.eventType}_description`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {event.maxAttendees != null
              ? t('manage.about.maxAttendees', { count: event.maxAttendees })
              : t('manage.about.unlimitedAttendees')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
