import { Link } from '@tanstack/react-router';
import { CalendarDays, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '~/contexts/auth';
import { useMyEvents } from '~/hooks/api/use-events';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { GLOBAL_ROLE_COLORS } from '~/lib/colors';
import { EventCard } from '~/components/events/event-card';
import type { Event } from '~/api/events/events.types';

function UpcomingSection({
  title,
  events,
}: {
  title: string;
  events: Event[];
}) {
  if (events.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
          {title}
        </h3>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">{events.length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} variant="compact" />
        ))}
      </div>
    </div>
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
    : [];

  const upcomingOrganizing = upcomingEvents.filter(
    (e) => e.myRole === 'OWNER' || e.myRole === 'ORGANIZER',
  );
  const upcomingAttending = upcomingEvents.filter((e) => e.myRole === 'ATTENDEE');

  const totalEvents = events?.length ?? 0;
  const upcomingCount = upcomingEvents.length;
  const hasUpcoming = upcomingOrganizing.length > 0 || upcomingAttending.length > 0;

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
        ) : hasUpcoming ? (
          <div className="space-y-6">
            <UpcomingSection
              title={t('events:list.sections.organizing')}
              events={upcomingOrganizing}
            />
            <UpcomingSection
              title={t('events:list.sections.attending')}
              events={upcomingAttending}
            />
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
