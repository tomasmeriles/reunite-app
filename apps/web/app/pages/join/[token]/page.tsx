import { useParams, useNavigate } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { CheckCircle2, Users } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { FormTextField } from '~/components/forms/form-text-field';
import { LoadingButton } from '~/components/buttons/loading-button';
import { useResolveInviteLink } from '~/hooks/api/use-invite-links';
import {
  useRegisterAttendee,
  useMyAttendance,
} from '~/hooks/api/use-attendance';
import axios from 'axios';
import { useAuth } from '~/contexts/auth';
import { useConfetti } from '~/contexts/confetti';
import { useApiError } from '~/hooks/use-api-error';
import type { ResolveInviteLinkError } from '~/api/invite-links/invite-links.types';
import { FormContainer } from '~/components/forms';
import { joinSchema, type JoinFormValues } from '~/lib/schemas/join.schema';
import { Hero } from './components/hero';
import { EventOverview } from './components/event-overview';

// ─── Loading ─────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <Skeleton className="h-56 w-full sm:h-72" />
      <div className="-mt-6 w-full max-w-lg px-4">
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-md">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JoinPage() {
  const apiError = useApiError();
  const { token } = useParams({ from: '/join/$token' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { launchConfetti } = useConfetti();

  const {
    data: linkData,
    isLoading,
    isError,
    error,
  } = useResolveInviteLink(token);

  const unusableError: ResolveInviteLinkError | null =
    isError && axios.isAxiosError(error) && error.response?.status === 422
      ? error.response.data
      : null;

  const eventId = linkData?.event.id ?? '';

  const { mutate: register, isPending } = useRegisterAttendee(eventId);
  const { data: myAttendance } = useMyAttendance(eventId);

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { name: '' },
  });

  const onSubmit: SubmitHandler<JoinFormValues> = ({ name }) => {
    const trimmed = name.trim();
    register(
      { inviteToken: token, guestName: trimmed },
      {
        onSuccess: () => {
          launchConfetti();
          toast.success("You're in! 🎉");
          void navigate({ to: '/events/$id', params: { id: eventId } });
        },
        onError: (err) =>
          toast.error(apiError(err)),
      },
    );
  };

  if (isLoading) return <LoadingState />;

  if (unusableError) {
    const { event, reason } = unusableError;
    const messages: Record<
      ResolveInviteLinkError['reason'],
      { title: string; body: string }
    > = {
      draft: {
        title: 'Event not published yet',
        body: "This event hasn't been published yet. Check back later.",
      },
      unavailable: {
        title: 'Event no longer available',
        body: 'This event has ended or been cancelled.',
      },
      expired: {
        title: 'Link expired',
        body: 'This invite link has expired. Ask the organizer for a new one.',
      },
      max_uses_reached: {
        title: 'Link is full',
        body: 'This invite link has reached its limit.',
      },
    };
    const msg = messages[reason];

    return (
      <div className="flex min-h-screen flex-col items-center">
        <Hero coverImage={event.coverImage} title={event.title} />
        <div className="-mt-6 w-full max-w-lg px-4 pb-8">
          <Card className="shadow-md">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {event.title}
                </p>
                <p className="text-xl font-bold">{msg.title}</p>
              </div>
              <EventOverview event={event} />
              {event.description && (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
              <Badge variant="secondary">{msg.body}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !linkData) {
    return (
      <div className="flex min-h-screen flex-col items-center">
        <Hero />
        <div className="-mt-6 w-full max-w-lg px-4">
          <Card className="shadow-md">
            <CardContent className="space-y-2 p-6">
              <p className="text-lg font-semibold">Invalid link</p>
              <p className="text-sm text-muted-foreground">
                This invite link doesn't exist. Ask the event organizer for a
                valid link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { event, link } = linkData;
  const remainingUses =
    link.maxUses !== null ? link.maxUses - link.useCount : null;

  const invitedBadge = (
    <Badge className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-widest">
      You're invited
    </Badge>
  );

  if (myAttendance?.status === 'CONFIRMED') {
    return (
      <div className="flex min-h-screen flex-col items-center">
        <Helmet>
          <title>{event.title} — Reunite</title>
        </Helmet>
        <Hero coverImage={event.coverImage} title={event.title} />
        <div className="-mt-6 w-full max-w-lg px-4 pb-8">
          <Card className="shadow-md">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  You're invited
                </p>
                <h1 className="text-2xl font-bold">{event.title}</h1>
              </div>
              <EventOverview event={event} />
              {event.description && (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <p className="text-sm font-medium text-success">
                  You're already registered!
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  void navigate({ to: '/events/$id', params: { id: eventId } })
                }
              >
                Go to event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (myAttendance?.status === 'WAITLISTED') {
    return (
      <div className="flex min-h-screen flex-col items-center">
        <Helmet>
          <title>{event.title} — Reunite</title>
        </Helmet>
        <Hero coverImage={event.coverImage} title={event.title} />
        <div className="-mt-6 w-full max-w-lg px-4 pb-8">
          <Card className="shadow-md">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  You're invited
                </p>
                <h1 className="text-2xl font-bold">{event.title}</h1>
              </div>
              <EventOverview event={event} />
              {event.description && (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
                <p className="text-sm font-medium text-warning-foreground">
                  You're on the waitlist
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  We'll let you know if a spot opens up.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  void navigate({ to: '/events/$id', params: { id: eventId } })
                }
              >
                View event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>You're invited to {event.title} — Reunite</title>
      </Helmet>

      <div className="flex min-h-screen flex-col items-center">
        <Hero
          coverImage={event.coverImage}
          title={event.title}
          badge={invitedBadge}
        />

        <div className="-mt-6 w-full max-w-lg px-4 pb-8">
          <Card className="shadow-md">
            <CardContent className="space-y-5 p-6">
              <h1 className="text-2xl font-bold">{event.title}</h1>

              <EventOverview event={event} />

              {event.description && (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}

              {(event.maxAttendees !== null || remainingUses !== null) && (
                <div className="flex flex-wrap gap-2">
                  {event.maxAttendees !== null && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {event.maxAttendees} capacity
                    </Badge>
                  )}
                  {remainingUses !== null && (
                    <Badge variant="outline" className="text-xs">
                      {remainingUses} spot{remainingUses !== 1 ? 's' : ''} left
                      on this link
                    </Badge>
                  )}
                </div>
              )}

              <FormContainer
                form={form}
                onSubmit={onSubmit}
                className="space-y-4 pt-1"
              >
                <FormTextField
                  control={form.control}
                  name="name"
                  label="Your name"
                  placeholder="Your name"
                  autoFocus
                />
                {user && (
                  <p className="-mt-2 text-xs text-muted-foreground">
                    You can use a different name than your profile for this
                    event.
                  </p>
                )}
                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isPending}
                  loadingText="Joining…"
                  disabled={!eventId}
                >
                  Join event 🎉
                </LoadingButton>
              </FormContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
