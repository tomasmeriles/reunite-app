import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { useLocationPicker } from '~/hooks/use-location-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  CalendarDays,
  MapPin,
  Globe,
  Link,
  Users,
  Ticket,
  TicketPlus,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { GoogleMap } from '~/components/ui/google-map';
import { Stepper } from '~/components/ui/stepper';
import type { StepDef } from '~/components/ui/stepper';
import {
  FormContainer,
  FormTextField,
  FormTextareaField,
  FormDateTimeField,
  FormCardSelectField,
  FormLocationField,
  StepActions,
} from '~/components/forms';
import type { CardSelectOption } from '~/components/forms';
import { useCreateEvent } from '~/hooks/api/use-events';
import { useSteppedForm } from '~/hooks/use-stepped-form';
import { useDateRangeDisabled } from '~/hooks/use-date-range-disabled';
import { getApiErrorMessage } from '~/lib/axios';
import { formatDateTime, getSystemTimezone, DateTime } from '~/lib/datetime';
import {
  createEventSchema,
  createEventBaseSchema,
  type CreateEventFormValues,
} from '~/lib/schemas/event.schema';
import type { EventType } from '~/api/events/events.types';

function toApiPayload(values: CreateEventFormValues) {
  const toISO = (date: string) =>
    DateTime.fromISO(date, { zone: values.timezone }).toISO() ?? date;

  const { startAt, endAt, ...rest } = values;
  return {
    ...rest,
    startAt: toISO(startAt),
    endAt: endAt ? toISO(endAt) : undefined,
  };
}

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
    icon: Link,
  },
  {
    value: 'INVITE_ACCOUNT',
    label: 'Guest list',
    description: 'Pre-approved accounts only',
    icon: Users,
  },
];

// Fields validated per step (0-indexed)
const STEP_FIELDS: FieldPath<CreateEventFormValues>[][] = [
  ['title', 'description', 'eventType'],
  ['startAt', 'endAt'],
  ['location'],
];

const STEPS: StepDef[] = [
  {
    icon: Ticket,
    title: 'About & Access',
    description: 'Name, description and who can join',
  },
  {
    icon: CalendarDays,
    title: 'When',
    description: 'Start and end date & time',
  },
  {
    icon: MapPin,
    title: 'Where',
    description: 'Location name and address',
  },
];

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { mutate: createEvent, isPending } = useCreateEvent();
  const picker = useLocationPicker();

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      eventType: 'PUBLIC',
      location: '',
      latitude: undefined,
      longitude: undefined,
      startAt: '',
      endAt: '',
      timezone: getSystemTimezone(),
    },
  });

  const onSubmit = (values: CreateEventFormValues) => {
    createEvent(toApiPayload(values), {
      onSuccess: (event) => {
        toast.success('Event created!');
        void navigate({ to: '/events/$id/manage', params: { id: event.id } });
      },
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Failed to create event')),
    });
  };

  // ── Live values for step summaries ──
  const watched = form.watch();

  const { startDisabled, endDisabled } = useDateRangeDisabled(
    watched.startAt,
    watched.endAt,
    { disablePast: true },
  );

  const activeTypeOption = EVENT_TYPE_OPTIONS.find(
    (o) => o.value === watched.eventType,
  );
  const typeLabel = activeTypeOption?.label ?? '';
  const TypeIcon = activeTypeOption?.icon ?? Globe;

  const stepSchemas = [
    createEventBaseSchema.pick({ title: true }),
    createEventBaseSchema.pick({ startAt: true }),
  ];

  const { currentStep, handleNext, handleBack, goToStep } = useSteppedForm({
    form,
    stepFields: STEP_FIELDS,
    onSubmit,
    isStepValid: (step) =>
      stepSchemas[step]?.safeParse(watched).success ?? true,
  });

  const summaries = [
    // Step 1 — About & Access
    watched.title ? (
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground leading-tight">
          {watched.title}
        </p>
        {watched.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {watched.description}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] font-medium leading-none text-primary/80">
          <TypeIcon className="h-3 w-3" />
          {typeLabel}
        </span>
      </div>
    ) : null,

    // Step 2 — When
    watched.startAt ? (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">From</span>{' '}
          {formatDateTime(watched.startAt)}
        </p>
        {watched.endAt && (
          <p>
            <span className="font-medium text-foreground">To</span>{' '}
            {formatDateTime(watched.endAt)}
          </p>
        )}
      </div>
    ) : null,

    // Step 3 — Where
    watched.location ? (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{watched.location}</p>
      </div>
    ) : null,
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an event
        </h1>
        <p className="text-muted-foreground">
          Fill in the details below to get your event live.
        </p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="pt-6">
          <FormContainer form={form} onSubmit={onSubmit}>
            <Stepper
              vertical
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={goToStep}
              summaries={summaries}
            >
              {/* ── Step 1: About & Access ── */}
              <div className="space-y-4">
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
                  rows={3}
                  optional
                />
                <FormCardSelectField
                  control={form.control}
                  name="eventType"
                  label="Access type"
                  options={EVENT_TYPE_OPTIONS}
                />
                <StepActions onNext={handleNext} />
              </div>

              {/* ── Step 2: When ── */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormDateTimeField
                    control={form.control}
                    name="startAt"
                    label="Start date & time"
                    disabled={startDisabled}
                    disablePast
                  />
                  <FormDateTimeField
                    control={form.control}
                    name="endAt"
                    label="End date & time"
                    optional
                    disabled={endDisabled}
                    disablePast
                  />
                </div>
                <StepActions onNext={handleNext} onBack={handleBack} />
              </div>

              {/* ── Step 3: Where ── */}
              <div className="space-y-4">
                <FormLocationField
                  control={form.control}
                  name="location"
                  picker={picker}
                  latName="latitude"
                  lngName="longitude"
                  timezoneName="timezone"
                  label="Location"
                  optional
                />
                {picker.selected && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[
                      picker.selected.city,
                      picker.selected.state,
                      picker.selected.country,
                    ]
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
                    className="h-36 rounded-lg overflow-hidden"
                  />
                )}
                <StepActions
                  onBack={handleBack}
                  isSubmit
                  submitLabel="Create Event"
                  submitIcon={TicketPlus}
                  isPending={isPending}
                />
              </div>
            </Stepper>
          </FormContainer>
        </CardContent>
      </Card>
    </div>
  );
}
