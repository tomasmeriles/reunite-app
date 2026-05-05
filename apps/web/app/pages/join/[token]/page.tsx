import { useParams, useNavigate } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Users } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
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
import { useAuthModal } from '~/contexts/auth-modal';
import { useConfetti } from '~/contexts/confetti';
import { useApiError } from '~/hooks/use-api-error';
import type { ResolveInviteLinkError } from '~/api/invite-links/invite-links.types';
import { FormContainer } from '~/components/forms';
import { PublicTopBar } from '~/components/layout/public-top-bar';
import { joinSchema, type JoinFormValues } from '~/lib/schemas/join.schema';
import { Hero } from './components/hero';
import { EventOverview } from './components/event-overview';

// ─── Loading ─────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen">
      <PublicTopBar user={null} />
      <div className="flex flex-col items-center">
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
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JoinPage() {
  const { t } = useTranslation('events');
  const apiError = useApiError();
  const { token } = useParams({ from: '/join/$token' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
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
          toast.success(t('join.successToast'));
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
    const msg = {
      title: t(`join.errors.${reason}.title`),
      body: t(`join.errors.${reason}.body`),
    };

    return (
      <div className="min-h-screen">
        <PublicTopBar user={user} />
        <div className="flex flex-col items-center">
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
      </div>
    );
  }

  if (isError || !linkData) {
    return (
      <div className="min-h-screen">
        <PublicTopBar user={user} />
        <div className="flex flex-col items-center">
          <Hero />
          <div className="-mt-6 w-full max-w-lg px-4">
            <Card className="shadow-md">
              <CardContent className="space-y-2 p-6">
                <p className="text-lg font-semibold">{t('join.invalidLink')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('join.invalidLinkDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const { event, link } = linkData;
  const remainingUses =
    link.maxUses !== null ? link.maxUses - link.useCount : null;

  const invitedBadge = (
    <Badge className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-widest">
      {t('join.youreInvited')}
    </Badge>
  );

  if (myAttendance?.status === 'CONFIRMED') {
    return (
      <div className="min-h-screen">
        <Helmet>
          <title>{event.title} — Reunite</title>
        </Helmet>
        <PublicTopBar user={user} />
        <div className="flex flex-col items-center">
          <Hero coverImage={event.coverImage} title={event.title} />
          <div className="-mt-6 w-full max-w-lg px-4 pb-8">
            <Card className="shadow-md">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('join.youreInvited')}
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
                    {t('join.alreadyRegistered')}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    void navigate({ to: '/events/$id', params: { id: eventId } })
                  }
                >
                  {t('join.viewEvent')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (myAttendance?.status === 'WAITLISTED') {
    return (
      <div className="min-h-screen">
        <Helmet>
          <title>{event.title} — Reunite</title>
        </Helmet>
        <PublicTopBar user={user} />
        <div className="flex flex-col items-center">
          <Hero coverImage={event.coverImage} title={event.title} />
          <div className="-mt-6 w-full max-w-lg px-4 pb-8">
            <Card className="shadow-md">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('join.youreInvited')}
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
                    {t('join.onWaitlist')}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('join.waitlistDesc')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    void navigate({ to: '/events/$id', params: { id: eventId } })
                  }
                >
                  {t('join.viewEvent')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('join.helmetInvited', { title: event.title })}</title>
      </Helmet>

      <div className="min-h-screen">
        <PublicTopBar user={user} />
        <div className="flex flex-col items-center">
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
                        {t('join.capacity', { count: event.maxAttendees })}
                      </Badge>
                    )}
                    {remainingUses !== null && (
                      <Badge variant="outline" className="text-xs">
                        {t('join.spotsLeft', { count: remainingUses })}
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
                    label={t('join.yourName')}
                    placeholder={t('join.yourNamePlaceholder')}
                    autoFocus
                  />
                  {user && (
                    <p className="-mt-2 text-xs text-muted-foreground">
                      {t('join.nameHelp')}
                    </p>
                  )}

                  {!user && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
                          {t('join.signInPrompt')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => openAuthModal('login')}
                      >
                        {t('join.signIn')}
                      </Button>
                    </div>
                  )}

                  <LoadingButton
                    type="submit"
                    className="w-full"
                    isLoading={isPending}
                    loadingText={t('join.joining')}
                    disabled={!eventId}
                  >
                    {t('join.joinEvent')}
                  </LoadingButton>
                </FormContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
