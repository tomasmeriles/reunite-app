import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useCreateEvent } from '~/hooks/api/use-events';
import { getApiErrorMessage } from '~/lib/axios';
import type { EventType } from '~/api/events/events.types';

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'INVITE_LINK', 'INVITE_ACCOUNT'] as const),
  location: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  timezone: z
    .string()
    .default(Intl.DateTimeFormat().resolvedOptions().timeZone),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

const EVENT_TYPE_LABELS: Record<
  EventType,
  { label: string; description: string }
> = {
  PUBLIC: {
    label: 'Public',
    description: 'Anyone can join without an account',
  },
  INVITE_LINK: {
    label: 'Invite Link',
    description: 'Guests need a link to register',
  },
  INVITE_ACCOUNT: {
    label: 'Guest List',
    description: 'Only pre-approved @usernames can attend',
  },
};

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { mutate: createEvent, isPending } = useCreateEvent();
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'PUBLIC',
      location: '',
      address: '',
      startDate: '',
      endDate: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = (values: CreateEventFormValues) => {
    createEvent(
      {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate
          ? new Date(values.endDate).toISOString()
          : undefined,
      },
      {
        onSuccess: (event) => {
          toast.success('Event created!');
          navigate({ to: '/events/$id/manage', params: { id: event.id } });
        },
        onError: (err) =>
          toast.error(getApiErrorMessage(err, 'Failed to create event')),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Create an Event</h1>
        <p className="text-muted-foreground">
          Set up your birthday event and invite your guests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Birthday Party 🎂" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your guests what to expect…"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          Object.entries(EVENT_TYPE_LABELS) as [
                            EventType,
                            { label: string; description: string },
                          ][]
                        ).map(([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <span className="font-medium">{label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              — {description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date & time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date & time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rooftop Bar, City Center"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St, New York, NY 10001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Cover image (optional)</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1.5"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
                {coverFile && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {coverFile.name} — you can upload this after saving
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create Event'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
