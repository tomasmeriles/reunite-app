import {
  Globe,
  Link as LinkIcon,
  Users,
  Pencil,
  UserRoundCheck,
} from 'lucide-react';
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
import { Input } from '~/components/ui/input';
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

const EVENT_TYPE_OPTIONS: CardSelectOption<EventType>[] = [
  {
    value: 'PUBLIC',
    label: 'Public',
    description: 'Anyone can join',
    icon: Globe,
  },
  {
    value: 'INVITE_LINK',
    label: 'Invite link',
    description: 'Guests need a link to join',
    icon: LinkIcon,
  },
  {
    value: 'INVITE_ACCOUNT',
    label: 'Guest list',
    description: 'Pre-approved accounts only',
    icon: Users,
  },
];

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  event: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

function AboutAccessEditForm({ event, onSuccess, onCancel }: EditFormProps) {
  const apiError = useApiError();
  const { mutate: updateEvent, isPending } = useUpdateEvent(event.id);

  const form = useForm<UpdateEventFormValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: eventToFormDefaults(event),
  });

  const { isDirty } = form.formState;

  const onSubmit = (values: UpdateEventFormValues) => {
    const { title, description, eventType, maxAttendees } = values;
    updateEvent(
      { title, description, eventType, maxAttendees },
      {
        onSuccess: () => {
          toast.success('Event details updated');
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
          label="Event title"
          placeholder="My Birthday Party 🎂"
        />
        <FormTextareaField
          control={form.control}
          name="description"
          label="Description"
          placeholder="Tell your guests what to expect…"
          rows={4}
          optional
        />
        <FormCardSelectField
          control={form.control}
          name="eventType"
          label="Access type"
          options={EVENT_TYPE_OPTIONS}
          columns={3}
        />
        <FormField
          control={form.control}
          name="maxAttendees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Max attendees{' '}
                <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                  optional
                </span>
              </FormLabel>
              <FormControl>
                {/* // TODO: Move this to a separate input number component */}
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
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

interface AboutAccessCardProps {
  event: Event;
}

const TYPE_ICON = {
  PUBLIC: Globe,
  INVITE_LINK: LinkIcon,
  INVITE_ACCOUNT: Users,
} as const;

export function AboutAccessCard({ event }: AboutAccessCardProps) {
  const { canEdit } = useEventAccess(event.id);
  const Icon = TYPE_ICON[event.eventType];
  const typeOption = EVENT_TYPE_OPTIONS.find(
    (o) => o.value === event.eventType,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>About &amp; Access</CardTitle>
          <CardDescription>Title, description and who can join</CardDescription>
        </div>
        {canEdit && (
          <Modal
            title="About & Access"
            description="Edit event title, description and access type"
            trigger={
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit about & access</span>
              </Button>
            }
          >
            {({ close }) => (
              <AboutAccessEditForm
                event={event}
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
            {typeOption?.description ?? event.eventType}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {event.maxAttendees != null
              ? `Max ${event.maxAttendees} attendees`
              : 'Unlimited attendees'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
