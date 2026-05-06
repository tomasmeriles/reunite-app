import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { DateTime } from 'luxon';
import type { ResolveInviteLinkResponse } from '~/api/invite-links/invite-links.types';

function formatDateRange(startDate: string, endDate: string, timezone: string) {
  const start = DateTime.fromISO(startDate).setZone(timezone);
  const end = DateTime.fromISO(endDate).setZone(timezone);

  const dateStr = start.toLocaleString({
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = start.toLocaleString(DateTime.TIME_SIMPLE);
  const endTime = end.toLocaleString(DateTime.TIME_SIMPLE);
  const tz = start.toFormat('ZZZZ');

  return { dateStr, timeRange: `${startTime} – ${endTime}`, tz };
}

interface EventOverviewProps {
  event: ResolveInviteLinkResponse['event'];
}

export function EventOverview({ event }: EventOverviewProps) {
  const { dateStr, timeRange, tz } = formatDateRange(
    event.startDate,
    event.endDate,
    event.timezone,
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{dateStr}</span>
      </div>
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {timeRange}
          <span className="ml-1 text-xs opacity-70">{tz}</span>
        </span>
      </div>
      {event.location && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {event.latitude && event.longitude ? (
              <a
                href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-medium underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground transition-colors"
              >
                {event.location}
              </a>
            ) : (
              event.location
            )}
            {(event.city || event.country) && (
              <span className="ml-1 text-xs opacity-75">
                · {[event.city, event.country].filter(Boolean).join(', ')}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
