import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { useAuth } from '~/contexts/auth';
import { useMyEvents } from '~/hooks/api/use-events';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { GLOBAL_ROLE_COLORS, EVENT_STATUS_COLORS } from '~/lib/colors';
import { formatDate } from '~/lib/datetime';
import type { Event } from '~/api/events/events.types';

function EventCard({ event }: { event: Event }) {
  return (
    <Link to="/events/$id" params={{ id: event.id }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        <div className="relative h-28 bg-muted">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground/30" />
            </div>
          )}
          <Badge
            className={`absolute top-2 right-2 text-xs ${EVENT_STATUS_COLORS[event.status]}`}
          >
            {event.status}
          </Badge>
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{formatDate(event.startAt)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: events, isLoading } = useMyEvents();

  const now = new Date().toISOString();
  const upcomingEvents = events
    ? events
        .filter(
          (e) =>
            e.startAt > now && e.status !== 'CANCELLED' && e.status !== 'ENDED',
        )
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .slice(0, 4)
    : [];

  const totalEvents = events?.length ?? 0;
  const upcomingCount = events
    ? events.filter(
        (e) =>
          e.startAt > now && e.status !== 'CANCELLED' && e.status !== 'ENDED',
      ).length
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground text-sm">Your role:</span>
            <Badge className={GLOBAL_ROLE_COLORS[user?.globalRole ?? 'MEMBER']}>
              {user?.globalRole?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link to="/events/create">
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <p className="text-3xl font-bold">{totalEvents}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">Events created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <p className="text-3xl font-bold">{upcomingCount}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events">View all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create your first event and invite your people!
            </p>
            <Button asChild size="sm" className="gap-2">
              <Link to="/events/create">
                <Plus className="h-3.5 w-3.5" />
                Create event
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
