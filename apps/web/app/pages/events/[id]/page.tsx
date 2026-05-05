import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Lock, EyeOff, Users, Clock } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Skeleton } from '~/components/ui/skeleton';
import { useEvent } from '~/hooks/api/use-events';
import {
  useRegisterAttendee,
  useMyAttendance,
  useAddGuest,
  useAttendeesInfinite,
  useUnregisterAttendee,
} from '~/hooks/api/use-attendance';
import { useAuth } from '~/contexts/auth';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import { ImageGallery } from '~/components/events/image-gallery';
import { PrizeList } from '~/components/events/prize-list';
import { AttendeeList } from '~/components/events/attendee-list';
import { RsvpDialog } from '~/components/events/rsvp-dialog';
import { AuthModal } from '~/components/auth/auth-modal';
import { ConfettiOverlay } from '~/components/events/confetti-overlay';
import { ImageWithFallback } from '~/components/ui/image-with-fallback';
import { EventCoverPlaceholder } from '~/components/events/event-cover-placeholder';
import { EventDetailHeader } from '~/components/events/event-detail-header';
import { PublicTopBar } from '~/components/layout/public-top-bar';
import { Alert } from '~/components/ui/alert';
import { EmptyState } from '~/components/ui/empty-state';
import { Modal, ModalFooter } from '~/components/ui/modal';

const TABS = ['guests', 'gallery', 'prizes'] as const;
type TabValue = (typeof TABS)[number];

export default function EventDetailPage() {
  const { t } = useTranslation(['events', 'attendance', 'common']);
  const apiError = useApiError();
  const { id } = useParams({ from: '/events/$id' });
  const [tab, setTab] = useQueryState<TabValue>(
    'tab',
    parseAsStringLiteral(TABS).withDefault('guests'),
  );
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id);

  const [guestToken, setGuestToken] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(`guest_token_${id}`)
      : null,
  );

  const { data: attendeesData } = useAttendeesInfinite(
    id,
    undefined,
    guestToken,
  );
  const attendeeTotal = attendeesData?.pages[0]?.meta.total;
  const { data: myAttendance, isPending: attendancePending } =
    useMyAttendance(id);
  const { mutate: register, isPending: registering } = useRegisterAttendee(id);
  const { mutate: addGuest, isPending: addingGuest } = useAddGuest(id);
  const { mutate: unregisterSelf, isPending: unregistering } =
    useUnregisterAttendee(id);
  const access = useEventAccess(id);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRsvpDialog, setShowRsvpDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const isAttending = justRegistered || myAttendance?.status === 'CONFIRMED';
  const isConfirmedAttendee = isAttending;
  const isPrivateEvent =
    event?.eventType === 'INVITE_LINK' || event?.eventType === 'INVITE_ACCOUNT';
  const registrationsEnabled = event?.config?.registrationsEnabled ?? true;

  const inviteLinkFull =
    !!myAttendance?.inviteLink?.maxUses &&
    myAttendance.inviteLink.useCount >= myAttendance.inviteLink.maxUses;
  const inviteLinkRemaining =
    myAttendance?.inviteLink?.maxUses != null
      ? myAttendance.inviteLink.maxUses - myAttendance.inviteLink.useCount
      : null;

  const rsvpAutoOpened = useRef(false);
  useEffect(() => {
    if (rsvpAutoOpened.current || !event || myAttendance === undefined) return;
    const canJoinNow =
      !isAttending &&
      !isPrivateEvent &&
      registrationsEnabled &&
      event.status !== 'DRAFT' &&
      event.status !== 'ENDED' &&
      event.status !== 'CANCELLED';
    if (canJoinNow) {
      setShowRsvpDialog(true);
      rsvpAutoOpened.current = true;
    }
  }, [event, myAttendance, isAttending, isPrivateEvent, registrationsEnabled]);

  useEffect(() => {
    if (registrationsEnabled) return;
    setShowRsvpDialog(false);
    setShowAddGuestDialog(false);
  }, [registrationsEnabled]);

  const canAddGuest =
    isAttending &&
    (user || !!guestToken) &&
    registrationsEnabled &&
    !inviteLinkFull &&
    event?.status !== 'DRAFT' &&
    event?.status !== 'ENDED' &&
    event?.status !== 'CANCELLED' &&
    event?.eventType !== 'INVITE_ACCOUNT';

  const canAddSelf =
    access.isStaff &&
    !isAttending &&
    event?.status !== 'DRAFT' &&
    event?.status !== 'ENDED' &&
    event?.status !== 'CANCELLED';

  const canUnregisterSelf =
    isAttending && event?.status !== 'ENDED' && event?.status !== 'CANCELLED';

  const staffRoles = useMemo(
    () =>
      Object.fromEntries((event?.staff ?? []).map((s) => [s.userId, s.role])),
    [event?.staff],
  );

  const handleRsvp = (guestName?: string) => {
    register(
      { guestName },
      {
        onSuccess: (data) => {
          if (data.guestToken) setGuestToken(data.guestToken);
          setJustRegistered(true);
          setShowRsvpDialog(false);
          setShowConfetti(true);
          toast.success(t('attendance:register.success'));
        },
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const handleConfirmLeave = () => {
    unregisterSelf(leaveReason.trim() || undefined, {
      onSuccess: () => {
        setShowLeaveDialog(false);
        setLeaveReason('');
        toast.success(t('attendance:leave.success'));
        navigate({ to: user ? '/dashboard' : '/' });
      },
      onError: () => toast.error(t('attendance:leave.error')),
    });
  };

  const handleAddGuest = (guestName?: string) => {
    if (!guestName) return;
    addGuest(guestName, {
      onSuccess: () => {
        setShowAddGuestDialog(false);
        toast.success(t('attendance:bringGuest.success', { name: guestName }));
      },
      onError: (err) => toast.error(apiError(err)),
    });
  };

  const handleLoginRequest = () => {
    setShowRsvpDialog(false);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    rsvpAutoOpened.current = false;
    setShowRsvpDialog(true);
  };

  if (isLoading) {
    return (
      <>
        <PublicTopBar user={user} />
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <PublicTopBar user={user} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">
            {t('events:detail.eventNotFound')}
          </p>
        </div>
      </>
    );
  }

  const canJoin =
    !isAttending &&
    !isPrivateEvent &&
    registrationsEnabled &&
    event.status !== 'DRAFT' &&
    event.status !== 'ENDED' &&
    event.status !== 'CANCELLED';

  return (
    <>
      <Helmet>
        <title>{event.title} — Reunite</title>
        <meta
          name="description"
          content={event.description ?? `Join ${event.title} on Reunite`}
        />
      </Helmet>

      {showConfetti && (
        <ConfettiOverlay onComplete={() => setShowConfetti(false)} />
      )}

      <PublicTopBar user={user} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {event.status === 'DRAFT' &&
          !isPrivateEvent &&
          !isConfirmedAttendee &&
          !access.isStaff &&
          !attendancePending && (
            <Alert variant="warning">
              <AlertCircle />
              {t('events:detail.draftAlert')}
            </Alert>
          )}

        {!registrationsEnabled && (
          <Alert variant="warning">
            <AlertCircle />
            {t('events:detail.registrationsClosedAlert')}
          </Alert>
        )}

        {/* Cover */}
        <div className="overflow-hidden rounded-xl">
          <ImageWithFallback
            src={event.coverImage}
            alt={event.title}
            className="w-full h-auto block"
            fallback={
              <EventCoverPlaceholder
                title={event.title}
                className="aspect-3/1 w-full"
                size="xl"
              />
            }
          />
        </div>

        {/* Header */}
        <EventDetailHeader
          event={event}
          isAttending={isAttending}
          canJoin={canJoin}
          canAddGuest={!!canAddGuest}
          canAddSelf={!!canAddSelf}
          registrationsClosed={!registrationsEnabled}
          inviteLinkRemaining={inviteLinkRemaining}
          registering={registering}
          addingGuest={addingGuest}
          showManage={access.isStaff}
          canUnregisterSelf={canUnregisterSelf}
          onJoin={() => setShowRsvpDialog(true)}
          onAddGuest={() => setShowAddGuestDialog(true)}
          onLeave={() => setShowLeaveDialog(true)}
          onAddSelf={() =>
            register(
              {},
              {
                onSuccess: (data) => {
                  if (data.guestToken) setGuestToken(data.guestToken);
                  setJustRegistered(true);
                  setShowConfetti(true);
                  toast.success(t('attendance:register.success'));
                },
                onError: (err) => toast.error(apiError(err)),
              },
            )
          }
        />

        {event.description && (
          <>
            <Separator />
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {event.description}
            </p>
          </>
        )}

        <Separator />

        {/* Private event wall for non-attendees / non-staff */}
        {isPrivateEvent &&
        !isConfirmedAttendee &&
        !access.isStaff &&
        !attendancePending ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">{t('events:detail.privateEvent')}</p>
            <p className="text-sm text-muted-foreground">
              {event.eventType === 'INVITE_LINK'
                ? t('events:detail.needInviteLink')
                : t('events:detail.invitationOnly')}
            </p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => void setTab(v as TabValue)}>
            <TabsList>
              <TabsTrigger value="guests">
                {t('events:detail.tabs.attendees')}{' '}
                {attendeeTotal != null ? `(${attendeeTotal})` : ''}
              </TabsTrigger>
              <TabsTrigger value="gallery">
                {t('events:detail.tabs.media')}
              </TabsTrigger>
              <TabsTrigger value="prizes">
                {t('events:detail.tabs.prizes')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guests" className="mt-4">
              {access.canSeeAttendees ? (
                <AttendeeList
                  eventId={id}
                  currentAttendeeId={myAttendance?.id}
                  staffRoles={staffRoles}
                  guestToken={guestToken}
                />
              ) : event?.config?.attendeeAccess === 'DISABLED' ? (
                <EmptyState
                  icon={EyeOff}
                  message={t('events:detail.guestListDisabled')}
                  description={t('events:detail.guestListDisabledDesc')}
                />
              ) : event?.config?.attendeeAccess === 'ORGANIZERS_ONLY' ? (
                <EmptyState
                  icon={Lock}
                  message={t('events:detail.organizersOnly')}
                  description={t('events:detail.guestListOrganizerDesc')}
                />
              ) : event?.config?.attendeeAccess === 'ATTENDEES_ONLY' &&
                !isConfirmedAttendee ? (
                <EmptyState
                  icon={Users}
                  message={t('events:detail.attendeesOnly')}
                  description={t('events:detail.guestListAttendeeDesc')}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  message={t('events:detail.guestListUnavailable')}
                  description={t('events:detail.guestListUnavailableDesc')}
                />
              )}
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              {access.canViewMedia ? (
                <ImageGallery
                  eventId={id}
                  canUpload={access.canUploadMedia}
                  isStaff={access.isStaff}
                  guestToken={guestToken}
                />
              ) : access.isStaff ? (
                <EmptyState
                  icon={Clock}
                  message={t('events:detail.notAvailableYet')}
                  description={t('events:detail.galleryNotAvailableDesc')}
                />
              ) : event?.config?.mediaAccess === 'DISABLED' ? (
                <EmptyState
                  icon={EyeOff}
                  message={t('events:detail.galleryDisabled')}
                  description={t('events:detail.galleryDisabledDesc')}
                />
              ) : event?.config?.mediaAccess === 'ORGANIZERS_ONLY' ? (
                <EmptyState
                  icon={Lock}
                  message={t('events:detail.organizersOnly')}
                  description={t('events:detail.galleryOrganizerDesc')}
                />
              ) : event?.config?.mediaAccess === 'ATTENDEES_ONLY' &&
                !isConfirmedAttendee ? (
                <EmptyState
                  icon={Users}
                  message={t('events:detail.attendeesOnly')}
                  description={t('events:detail.galleryAttendeeDesc')}
                />
              ) : (
                <EmptyState
                  icon={Clock}
                  message={t('events:detail.notAvailableYet')}
                  description={t('events:detail.galleryNotAvailableDesc')}
                />
              )}
            </TabsContent>

            <TabsContent value="prizes" className="mt-4">
              <PrizeList eventId={id} canManage={false} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <RsvpDialog
        open={showRsvpDialog}
        onOpenChange={setShowRsvpDialog}
        eventType={event.eventType}
        onSubmit={handleRsvp}
        isLoading={registering}
        onLoginRequest={!user ? handleLoginRequest : undefined}
      />

      <RsvpDialog
        open={showAddGuestDialog}
        onOpenChange={setShowAddGuestDialog}
        eventType={event.eventType}
        onSubmit={handleAddGuest}
        isLoading={addingGuest}
        mode="guest"
      />

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />

      <Modal
        open={showLeaveDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowLeaveDialog(false);
            setLeaveReason('');
          }
        }}
        title={t('attendance:leave.dialogTitle')}
        description={t('attendance:leave.dialogDescription')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason" className="text-sm">
              {t('attendance:leave.reason')}{' '}
              <span className="text-muted-foreground">
                {t('attendance:leave.reasonOptional')}
              </span>
            </Label>
            <Textarea
              id="leave-reason"
              placeholder={t('attendance:leave.reasonPlaceholder')}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowLeaveDialog(false);
                setLeaveReason('');
              }}
              disabled={unregistering}
            >
              {t('attendance:leave.stay')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmLeave}
              disabled={unregistering}
            >
              {t('attendance:leave.confirm')}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </>
  );
}
