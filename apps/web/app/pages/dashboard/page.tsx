import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '~/contexts/auth';
import { useMyEvents } from '~/hooks/api/use-events';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { GLOBAL_ROLE_COLORS } from '~/lib/colors';
import { STATUS_META } from '~/lib/event-state-machine';
import { formatDate } from '~/lib/datetime';
import type { Event } from '~/api/events/events.types';

function EventCard({ event }: { event: Event }) {
  const { t } = useTranslation('common');
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
            className={`absolute top-2 right-2 text-xs ${STATUS_META[event.status].colorClass}`}
          >
            {t(`status.${event.status}`)}
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
  const { t } = useTranslation(['common', 'events']);
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
            {t('common:dashboard.greeting')}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground text-sm">{t('common:dashboard.role')}:</span>
            <Badge className={GLOBAL_ROLE_COLORS[user?.globalRole ?? 'MEMBER']}>
              {t(`common:roles.${user?.globalRole ?? 'MEMBER'}`)}
            </Badge>
          </div>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link to="/events/create">
            <Plus className="h-4 w-4" />
            {t('events:list.new')}
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
            <p className="text-sm text-muted-foreground mt-1">{t('common:dashboard.eventsCreated')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <p className="text-3xl font-bold">{upcomingCount}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{t('common:dashboard.upcoming')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('common:dashboard.upcomingEvents')}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events">{t('common:dashboard.viewAll')}</Link>
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
            <p className="font-medium text-sm">{t('common:dashboard.noUpcoming')}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t('common:dashboard.noUpcomingSubtitle')}
            </p>
            <Button asChild size="sm" className="gap-2">
              <Link to="/events/create">
                <Plus className="h-3.5 w-3.5" />
                {t('common:dashboard.createEvent')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
