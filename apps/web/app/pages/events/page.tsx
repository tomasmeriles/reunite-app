import { Link } from '@tanstack/react-router';
import { CalendarDays, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMyEvents } from '~/hooks/api/use-events';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { EventCard } from '~/components/events/event-card';
import type { Event } from '~/api/events/events.types';

function EventsSection({ title, events, count }: { title: string; events: Event[]; count: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground shrink-0">{count}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { t } = useTranslation(['events', 'common']);
  const { data: events, isLoading } = useMyEvents();

  const organizingEvents = events?.filter(
    (e) => e.myRole === 'OWNER' || e.myRole === 'ORGANIZER',
  ) ?? [];
  const attendingEvents = events?.filter((e) => e.myRole === 'ATTENDEE') ?? [];
  const hasEvents = organizingEvents.length > 0 || attendingEvents.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('events:list.subtitle')}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/events/create">
            <Plus className="h-4 w-4" />
            {t('events:list.new')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : hasEvents ? (
        <div className="space-y-10">
          {organizingEvents.length > 0 && (
            <EventsSection
              title={t('events:list.sections.organizing')}
              events={organizingEvents}
              count={organizingEvents.length}
            />
          )}
          {attendingEvents.length > 0 && (
            <EventsSection
              title={t('events:list.sections.attending')}
              events={attendingEvents}
              count={attendingEvents.length}
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold">{t('events:list.empty')}</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            {t('events:list.emptySubtitle')}
          </p>
          <Button asChild className="gap-2">
            <Link to="/events/create">
              <Plus className="h-4 w-4" />
              {t('events:list.createFirst')}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
