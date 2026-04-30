import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { AlertCircle, Check, Lock, UserPlus, Zap } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Skeleton } from '~/components/ui/skeleton';
import { useEvent } from '~/hooks/api/use-events';
import {
  useRegisterAttendee,
  useMyAttendance,
  useAddGuest,
  useAttendees,
} from '~/hooks/api/use-attendance';
import { useAuth } from '~/contexts/auth';
import { useEventAccess } from '~/hooks/use-permission';
import { getApiErrorMessage } from '~/lib/axios';
import { ChatPanel } from '~/components/events/chat-panel';
import { ImageGallery } from '~/components/events/image-gallery';
import { PrizeList } from '~/components/events/prize-list';
import { AttendeeList } from '~/components/events/attendee-list';
import { RsvpDialog } from '~/components/events/rsvp-dialog';
import { ConfettiOverlay } from '~/components/events/confetti-overlay';
import { ImageWithFallback } from '~/components/ui/image-with-fallback';
import { EventCoverPlaceholder } from '~/components/events/event-cover-placeholder';
import { STATUS_META } from '~/lib/event-state-machine';
import { Alert } from '~/components/ui/alert';

export default function EventDetailPage() {
  const { id } = useParams({ from: '/events/$id' });
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const { data: attendees } = useAttendees(id);
  const { data: myAttendance, isPending: attendancePending } = useMyAttendance(id);
  const { mutate: register, isPending: registering } = useRegisterAttendee(id);
  const { mutate: addGuest, isPending: addingGuest } = useAddGuest(id);
  const access = useEventAccess(id);

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
          toast.error(getApiErrorMessage(err, 'Could not register')),
      },
    );
  };

  const handleAddGuest = (guestName?: string) => {
    if (!guestName) return;
    addGuest(guestName, {
      onSuccess: () => {
        setShowAddGuestDialog(false);
        toast.success(`${guestName} added!`);
      },
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Could not add guest')),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const statusMeta = STATUS_META[event.status];
  const startDate = new Date(event.startAt);
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

      <div className="mx-auto max-w-4xl space-y-6 py-8 px-4">
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {startDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground">
                📍 {event.location}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {isAttending ? (
              <>
                <Badge className="bg-success text-success-foreground">
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  You're attending
                </Badge>
                {canAddGuest && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddGuestDialog(true)}
                    disabled={addingGuest}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Bring a friend
                    {inviteLinkRemaining !== null && (
                      <Badge variant="secondary" className="ml-1.5 text-xs">
                        {inviteLinkRemaining} left
                      </Badge>
                    )}
                  </Button>
                )}
              </>
            ) : canJoin ? (
              <Button
                onClick={() => setShowRsvpDialog(true)}
                disabled={registering}
              >
                <Zap className="mr-1.5 h-4 w-4" />
                Jump in
              </Button>
            ) : null}

            {user && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/events/$id/manage" params={{ id }}>
                  Manage
                </Link>
              </Button>
            )}
          </div>
        </div>

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
          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="guests">
                Guests {attendees ? `(${attendees.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="prizes">Prizes</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4">
              {access.canReadChatHistory ? (
                <ChatPanel
                  eventId={id}
                  attendeeId={myAttendance?.id ?? null}
                  guestToken={guestToken}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chat is only available during the live event.
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

            <TabsContent value="guests" className="mt-4">
              <AttendeeList eventId={id} currentAttendeeId={myAttendance?.id} />
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
    </>
  );
}
