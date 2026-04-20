import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { useAttendees } from '~/hooks/api/use-attendance';

interface AttendeeListProps {
  eventId: string;
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  CONFIRMED: 'default',
  WAITLISTED: 'outline',
  CANCELLED: 'secondary',
};

export function AttendeeList({ eventId }: AttendeeListProps) {
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
        const name = attendee.user?.name ?? attendee.guestName ?? 'Guest';
        const username = attendee.user?.username;
        const avatar = attendee.user?.avatar ?? undefined;
        const initials = name.charAt(0).toUpperCase();

        return (
          <div key={attendee.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{name}</p>
                {username && (
                  <p className="text-xs text-muted-foreground">@{username}</p>
                )}
              </div>
            </div>
            <Badge variant={STATUS_BADGE[attendee.status] ?? 'secondary'}>
              {attendee.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
