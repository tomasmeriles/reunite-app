import { EventStatusCard } from './event-status-card';
import { EventSettingsCard } from './event-settings-card';
import { EventGuestListCard } from './event-guest-list-card';
import { EventDangerZone } from './event-danger-zone';
import type { Event } from '~/api/events/events.types';

interface ConfigTabProps {
  event: Event;
}

export function ConfigTab({ event }: ConfigTabProps) {
  return (
    <div className="space-y-4">
      <EventStatusCard event={event} />
      <EventSettingsCard event={event} />
      {event.eventType === 'INVITE_ACCOUNT' && (
        <EventGuestListCard event={event} />
      )}
      <EventDangerZone event={event} />
    </div>
  );
}
