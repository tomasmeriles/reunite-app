import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { useAttendees } from '~/hooks/api/use-attendance';

interface AttendeeListProps {
  eventId: string;
  currentAttendeeId?: string;
}

export function AttendeeList({ eventId, currentAttendeeId }: AttendeeListProps) {
  const { data: attendees, isLoading } = useAttendees(eventId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!attendees?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No guests yet. Share the event link!
      </p>
    );
  }

  const confirmed = attendees.filter((a) => a.status === 'CONFIRMED');

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {confirmed.length} confirmed{' '}
        {confirmed.length === 1 ? 'guest' : 'guests'}
      </p>
      {attendees.map((attendee) => {
        const isMe = attendee.id === currentAttendeeId;
        // guestName takes priority — lets registered users use a custom event name
        const name =
          attendee.guestName ?? attendee.user?.name ?? attendee.user?.username ?? 'Guest';
        const username = attendee.user?.username;
        const avatar = attendee.user?.avatar ?? undefined;
        const initials = name.charAt(0).toUpperCase();

        const sponsorName = attendee.sponsoredBy
          ? (attendee.sponsoredBy.guestName ??
            attendee.sponsoredBy.user?.name ??
            attendee.sponsoredBy.user?.username)
          : null;

        return (
          <div
            key={attendee.id}
            className={`flex items-center justify-between rounded-lg px-2 py-1 -mx-2 transition-colors ${
              isMe ? 'bg-muted/50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{name}</p>
                  {isMe && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                {username && (
                  <p className="text-xs text-muted-foreground">@{username}</p>
                )}
                {sponsorName && (
                  <p className="text-xs text-muted-foreground">
                    guest of {sponsorName}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {attendee.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
