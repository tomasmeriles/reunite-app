import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Badge, badgeVariants } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Skeleton } from '~/components/ui/skeleton';
import { useEvent } from '~/hooks/api/use-events';
import { useRegisterAttendee, useAttendees } from '~/hooks/api/use-attendance';
import { useAuth } from '~/contexts/auth';
import { useEventAccess } from '~/hooks/use-permission';
import { getApiErrorMessage } from '~/lib/axios';
import { ChatPanel } from '~/components/events/chat-panel';
import { ImageGallery } from '~/components/events/image-gallery';
import { PrizeList } from '~/components/events/prize-list';
import { AttendeeList } from '~/components/events/attendee-list';
import { RsvpDialog } from '~/components/events/rsvp-dialog';
import { ConfettiOverlay } from '~/components/events/confetti-overlay';
import type { VariantProps } from 'class-variance-authority';
import type { EventStatus } from '~/api/events/events.types';

const STATUS_BADGE: Record<
  EventStatus,
  NonNullable<VariantProps<typeof badgeVariants>['variant']>
> = {
  DRAFT: 'secondary',
  PUBLISHED: 'default',
  ACTIVE: 'default',
  RESCHEDULED: 'outline',
  ENDED: 'secondary',
  CANCELLED: 'destructive',
};

export default function EventDetailPage() {
  const { id } = useParams({ from: '/events/$id' });
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const { data: attendees } = useAttendees(id);
  const { mutate: register, isPending: registering } = useRegisterAttendee(id);
  const access = useEventAccess(id);

  const [showRsvpDialog, setShowRsvpDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const guestToken =
    typeof window !== 'undefined'
      ? localStorage.getItem(`guest_token_${id}`)
      : null;

  const myAttendee = attendees?.find(
    (a) =>
      (user && a.user?.id === user.id) || (guestToken && a.id === guestToken),
  );

  const isAttending = myAttendee?.status === 'CONFIRMED';

  const handleRsvp = (guestName?: string, inviteToken?: string) => {
    register(
      { guestName, inviteToken },
      {
        onSuccess: () => {
          setShowRsvpDialog(false);
          setShowConfetti(true);
          toast.success("You're in! See you at the party 🎉");
        },
        onError: (err) =>
          toast.error(getApiErrorMessage(err, 'Could not register')),
      },
    );
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

  const startDate = new Date(event.startAt);

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
        {/* Cover */}
        {event.coverImage && (
          <div className="aspect-3/1 overflow-hidden rounded-xl">
            <img
              src={event.coverImage}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <Badge variant={STATUS_BADGE[event.status]}>{event.status}</Badge>
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
              <Badge className="bg-success text-success-foreground">
                ✓ You're attending
              </Badge>
            ) : event.status !== 'DRAFT' &&
              event.status !== 'ENDED' &&
              event.status !== 'CANCELLED' ? (
              <Button
                onClick={() => setShowRsvpDialog(true)}
                disabled={registering}
              >
                RSVP
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

        {/* Tabs */}
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
                attendeeId={myAttendee?.id ?? null}
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
            <AttendeeList eventId={id} />
          </TabsContent>

          <TabsContent value="prizes" className="mt-4">
            <PrizeList eventId={id} canManage={false} />
          </TabsContent>
        </Tabs>
      </div>

      <RsvpDialog
        open={showRsvpDialog}
        onOpenChange={setShowRsvpDialog}
        eventType={event.eventType}
        onSubmit={handleRsvp}
        isLoading={registering}
      />
    </>
  );
}
