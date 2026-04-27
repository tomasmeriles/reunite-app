import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { EventCoverCard } from './event-cover-card';
import { AboutAccessCard } from './about-access-card';
import { WhenCard } from './when-card';
import { WhereCard } from './where-card';
import type { Event } from '~/api/events/events.types';

interface OverviewTabProps {
  event: Event;
}

export function OverviewTab({ event }: OverviewTabProps) {
  const eventUrl = `${window.location.origin}/events/${event.id}`;

  return (
    <div className="space-y-4">
      <EventCoverCard event={event} />
      <AboutAccessCard event={event} />
      <WhenCard event={event} />
      <WhereCard event={event} />

      <Card>
        <CardHeader>
          <CardTitle>Share link</CardTitle>
          <CardDescription>
            Send this to anyone you want to invite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={eventUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(eventUrl);
                toast.success('Link copied!');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">Copy</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
