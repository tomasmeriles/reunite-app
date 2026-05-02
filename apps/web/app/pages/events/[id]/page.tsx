import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { AlertCircle, ChevronLeft, Lock } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
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
import { useBreakpoint } from '~/hooks/use-breakpoint';
import { useApiError } from '~/hooks/use-api-error';
import { ChatPanel } from '~/components/events/chat-panel';
import { ImageGallery } from '~/components/events/image-gallery';
import { PrizeList } from '~/components/events/prize-list';
import { AttendeeList } from '~/components/events/attendee-list';
import { RsvpDialog } from '~/components/events/rsvp-dialog';
import { ConfettiOverlay } from '~/components/events/confetti-overlay';
import { ImageWithFallback } from '~/components/ui/image-with-fallback';
import { EventCoverPlaceholder } from '~/components/events/event-cover-placeholder';
import { EventDetailHeader } from '~/components/events/event-detail-header';
import { ThemeToggle } from '~/components/theme-toggle';
import { Alert } from '~/components/ui/alert';

export default function EventDetailPage() {
  const apiError = useApiError();
  const { id } = useParams({ from: '/events/$id' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  const { data: event, isLoading } = useEvent(id);
  const { data: attendeesData } = useAttendeesInfinite(id);
  const attendeeTotal = attendeesData?.pages[0]?.meta.total;
  const { data: myAttendance, isPending: attendancePending } = useMyAttendance(id);
  const { mutate: register, isPending: registering } = useRegisterAttendee(id);
  const { mutate: addGuest, isPending: addingGuest } = useAddGuest(id);
  const { mutate: unregisterSelf, isPending: unregistering } = useUnregisterAttendee(id);
  const access = useEventAccess(id);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRsvpDialog, setShowRsvpDialog] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  // Read raw from localStorage — useLocalStorage would corrupt this value by
  // JSON.parse-failing on the UUID then overwriting it with "null" on mount.
  const [guestToken, setGuestToken] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(`guest_token_${id}`)
      : null,
  );

  const isAttending = justRegistered || myAttendance?.status === 'CONFIRMED';
  const isConfirmedAttendee = isAttending;
  const isPrivateEvent =
    event?.eventType === 'INVITE_LINK' || event?.eventType === 'INVITE_ACCOUNT';

  const inviteLinkFull =
    !!myAttendance?.inviteLink?.maxUses &&
    myAttendance.inviteLink.useCount >= myAttendance.inviteLink.maxUses;
  const inviteLinkRemaining =
    myAttendance?.inviteLink?.maxUses != null
      ? myAttendance.inviteLink.maxUses - myAttendance.inviteLink.useCount
      : null;

  // Auto-open RSVP once when attendance data loads and user hasn't joined yet.
  const rsvpAutoOpened = useRef(false);
  useEffect(() => {
    if (rsvpAutoOpened.current || !event || myAttendance === undefined) return;
    const canJoinNow =
      !isAttending &&
      !isPrivateEvent &&
      event.status !== 'DRAFT' &&
      event.status !== 'ENDED' &&
      event.status !== 'CANCELLED';
    if (canJoinNow) {
      setShowRsvpDialog(true);
      rsvpAutoOpened.current = true;
    }
  }, [event, myAttendance, isAttending, isPrivateEvent]);

  const canAddGuest =
    isAttending &&
    (user || !!guestToken) &&
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
    isAttending &&
    event?.status !== 'ENDED' &&
    event?.status !== 'CANCELLED';

  const staffRoles = useMemo(
    () => Object.fromEntries((event?.staff ?? []).map((s) => [s.userId, s.role])),
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
          toast.success("You're in! See you at the party 🎉");
        },
        onError: (err) =>
          toast.error(apiError(err)),
      },
    );
  };

  const handleConfirmLeave = () => {
    unregisterSelf(leaveReason.trim() || undefined, {
      onSuccess: () => {
        setShowLeaveDialog(false);
        setLeaveReason('');
        toast.success("You've left the event");
        navigate({ to: user ? '/dashboard' : '/' });
      },
      onError: () => toast.error('Could not leave the event'),
    });
  };

  const handleAddGuest = (guestName?: string) => {
    if (!guestName) return;
    addGuest(guestName, {
      onSuccess: () => {
        setShowAddGuestDialog(false);
        toast.success(`${guestName} added!`);
      },
      onError: (err) =>
        toast.error(apiError(err)),
    });
  };

  const isMobile = breakpoint === 'xs';

  if (isLoading) {
    return (
      <>
        <TopBar user={user} isMobile={isMobile} />
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
        <TopBar user={user} isMobile={isMobile} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </>
    );
  }

  const canJoin =
    !isAttending &&
    !isPrivateEvent &&
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

      <TopBar user={user} isMobile={isMobile} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {event.status === 'DRAFT' && (
          <Alert variant="warning">
            <AlertCircle />
            This event is still a draft and not accesible yet.
          </Alert>
        )}

        {/* Cover */}
        <div className="aspect-3/1 overflow-hidden rounded-xl">
          <ImageWithFallback
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover"
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
          inviteLinkRemaining={inviteLinkRemaining}
          registering={registering}
          addingGuest={addingGuest}
          showManage={!!user}
          canUnregisterSelf={canUnregisterSelf}
          onJoin={() => setShowRsvpDialog(true)}
          onAddGuest={() => setShowAddGuestDialog(true)}
          onLeave={() => setShowLeaveDialog(true)}
          onAddSelf={() => register({}, {
            onSuccess: (data) => {
              if (data.guestToken) setGuestToken(data.guestToken);
              setJustRegistered(true);
              setShowConfetti(true);
              toast.success("You're in! See you at the party 🎉");
            },
            onError: (err) =>
              toast.error(apiError(err)),
          })}
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
        {isPrivateEvent && !isConfirmedAttendee && !access.isStaff && !attendancePending ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">This is a private event</p>
            <p className="text-sm text-muted-foreground">
              {event.eventType === 'INVITE_LINK'
                ? 'You need an invite link to join.'
                : 'Access is by invitation only.'}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="guests">
            <TabsList>
              <TabsTrigger value="guests">
                Guests {attendeeTotal != null ? `(${attendeeTotal})` : ''}
              </TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="prizes">Prizes</TabsTrigger>
            </TabsList>

            <TabsContent value="guests" className="mt-4">
              <AttendeeList
                eventId={id}
                currentAttendeeId={myAttendance?.id}
                staffRoles={staffRoles}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              {access.canReadChatHistory ? (
                <ChatPanel
                  eventId={id}
                  attendeeId={myAttendance?.id ?? null}
                  guestToken={guestToken}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chat is available once the event is published.
                </p>
              )}
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              {access.canViewMedia ? (
                <ImageGallery
                  eventId={id}
                  canUpload={access.canUploadMedia}
                  guestToken={guestToken}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Gallery is only available during the live event.
                </p>
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
      />

      <RsvpDialog
        open={showAddGuestDialog}
        onOpenChange={setShowAddGuestDialog}
        eventType={event.eventType}
        onSubmit={handleAddGuest}
        isLoading={addingGuest}
        mode="guest"
      />

      <AlertDialog
        open={showLeaveDialog}
        onOpenChange={(open) => {
          if (!open) { setShowLeaveDialog(false); setLeaveReason(''); }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this event?</AlertDialogTitle>
            <AlertDialogDescription>
              You can rejoin later if the event is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason" className="text-sm">
              Reason <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="leave-reason"
              placeholder="Let the organizer know why you're leaving…"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              disabled={unregistering}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  user: { name?: string | null } | null | undefined;
  isMobile: boolean;
}

function TopBar({ user, isMobile }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-1.5">
          <span className="text-lg">🎉</span>
          {!isMobile && (
            <span className="font-semibold tracking-tight">Reunite</span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={user ? '/dashboard' : '/'}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {!isMobile && (user ? 'Dashboard' : 'Home')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
