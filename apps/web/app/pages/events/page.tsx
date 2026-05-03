import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin, Plus, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMyEvents } from '~/hooks/api/use-events';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { STATUS_META } from '~/lib/event-state-machine';
import { formatDate, formatDateTime } from '~/lib/datetime';
import type { Event } from '~/api/events/events.types';

function EventCard({ event }: { event: Event }) {
  const { t } = useTranslation(['common', 'events']);
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      <div className="relative h-40 bg-muted shrink-0">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 text-xs ${STATUS_META[event.status].colorClass}`}
        >
          {t(`common:status.${event.status}`)}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <p className="font-semibold line-clamp-1">{event.title}</p>

        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDateTime(event.startAt)}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-3">
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link to="/events/$id" params={{ id: event.id }}>
              {t('common:actions.view')}
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/events/$id/manage" params={{ id: event.id }}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { t } = useTranslation(['events', 'common']);
  const { data: events, isLoading } = useMyEvents();

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
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
