import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useResolveInviteLink } from '~/hooks/api/use-invite-links';
import { useRegisterAttendee } from '~/hooks/api/use-attendance';
import { useAuth } from '~/contexts/auth';
import { getApiErrorMessage } from '~/lib/axios';

export default function JoinPage() {
  const { token } = useParams({ from: '/join/$token' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: linkData, isLoading, isError } = useResolveInviteLink(token);

  const eventId = linkData?.event.id ?? '';
  const { mutate: register, isPending } = useRegisterAttendee(eventId);

  const handleJoin = () => {
    register(
      { inviteToken: token },
      {
        onSuccess: () => {
          toast.success("You're in! 🎉");
          navigate({ to: '/events/$id', params: { id: eventId } });
        },
        onError: (err) =>
          toast.error(getApiErrorMessage(err, 'Could not join')),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  if (isError || !linkData?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or expired link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invite link is no longer valid. Please ask the event
              organizer for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event } = linkData;
  const startDate = new Date(event.startDate);

  return (
    <>
      <Helmet>
        <title>You're invited to {event.title} — Reunite</title>
      </Helmet>

      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {event.coverImage && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-xl">You're invited!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="text-sm text-muted-foreground">
                {startDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {!user && (
              <p className="text-sm text-muted-foreground">
                You'll join as a guest. No account required!
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={isPending || !eventId}
            >
              {isPending ? 'Joining…' : 'Accept Invitation 🎉'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() =>
                navigate({ to: '/events/$id', params: { id: eventId } })
              }
            >
              View event details
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
