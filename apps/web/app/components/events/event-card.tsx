import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { STATUS_META } from '~/lib/event-state-machine';
import { formatDateTime, formatDate } from '~/lib/datetime';
import { ROLE_META } from '~/lib/roles';
import type { Event } from '~/api/events/events.types';

type EventCardVariant = 'default' | 'compact';

interface EventCardProps {
  event: Event;
  variant?: EventCardVariant;
  showManageButton?: boolean;
}

export function EventCard({ event, variant = 'default', showManageButton = true }: EventCardProps) {
  const { t } = useTranslation(['common', 'events']);
  const roleMeta = event.myRole ? ROLE_META[event.myRole] : null;
  const RoleIcon = roleMeta?.icon;
  const isAttendeeOnly = event.myRole === 'ATTENDEE';

  const isCompact = variant === 'compact';
  const imageHeight = isCompact ? 'h-28' : 'h-40';
  const titleSize = isCompact ? 'text-sm' : 'text-base';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const iconSize = isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const padding = isCompact ? 'p-3' : 'p-4';
  const calendarIconSize = isCompact ? 'h-7 w-7' : 'h-10 w-10';

  const cardContent = (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow group ${!isCompact ? 'flex flex-col' : ''}`}>
      <div className={`relative bg-muted shrink-0 ${imageHeight}`}>
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className={`${calendarIconSize} text-muted-foreground/30`} />
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 text-xs ${STATUS_META[event.status].colorClass}`}
        >
          {t(`common:status.${event.status}`)}
        </Badge>
        {roleMeta && RoleIcon && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-xs gap-1"
          >
            <RoleIcon className={`h-3 w-3 ${roleMeta.className}`} />
            {t(`events:list.role.${event.myRole!.toLowerCase()}`)}
          </Badge>
        )}
      </div>

      <CardContent className={`${padding} ${!isCompact ? 'flex flex-col flex-1' : ''}`}>
        <p className={`font-semibold line-clamp-1 ${titleSize}`}>{event.title}</p>

        <div className={`flex items-center gap-1.5 mt-1.5 ${textSize} text-muted-foreground`}>
          <CalendarDays className={`${iconSize} shrink-0`} />
          <span>{isCompact ? formatDate(event.startAt) : formatDateTime(event.startAt)}</span>
        </div>

        {event.location && (
          <div className={`flex items-center gap-1.5 mt-0.5 ${textSize} text-muted-foreground`}>
            <MapPin className={`${iconSize} shrink-0`} />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {!isCompact && (
          <div className="flex gap-2 mt-auto pt-3">
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <Link to="/events/$id" params={{ id: event.id }}>
                {t('common:actions.view')}
              </Link>
            </Button>
            {!isAttendeeOnly && showManageButton && (
              <Button size="sm" variant="ghost" asChild>
                <Link to="/events/$id/manage" params={{ id: event.id }}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isCompact) {
    return <Link to="/events/$id" params={{ id: event.id }}>{cardContent}</Link>;
  }

  return cardContent;
}
