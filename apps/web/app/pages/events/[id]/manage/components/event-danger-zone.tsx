import { Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { ConfirmModal } from '~/components/ui/modal';
import { useDeleteEvent } from '~/hooks/api/use-events';
import { getApiErrorMessage } from '~/lib/axios';
import type { Event, EventStatus } from '~/api/events/events.types';

interface EventDangerZoneProps {
  event: Event;
}

const DELETE_BLOCKED_REASONS: Partial<Record<EventStatus, string>> = {
  PUBLISHED: 'Unpublish the event before deleting.',
  RESCHEDULED: 'Unpublish the event before deleting.',
  ACTIVE: 'You cannot delete a live event.',
  ENDED: 'Ended events cannot be deleted.',
};

export function EventDangerZone({ event }: EventDangerZoneProps) {
  const navigate = useNavigate();
  const { mutate: deleteEvent, isPending } = useDeleteEvent();

  const handleDelete = () => {
    deleteEvent(event.id, {
      onSuccess: () => {
        toast.success('Event deleted');
        void navigate({ to: '/dashboard' });
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const blockedReason = DELETE_BLOCKED_REASONS[event.status];
  const canDelete = !blockedReason;

  const confirmDescription =
    event.status === 'CANCELLED' ? (
      <>
        This will permanently delete <strong>{event.title}</strong> and all
        associated data including attendees, messages, and media. This action
        cannot be undone.
      </>
    ) : (
      <>
        This will permanently delete <strong>{event.title}</strong> and all
        associated data. This action cannot be undone.
      </>
    );

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          These actions are permanent and cannot be undone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Delete event</p>
            <p className="text-xs text-muted-foreground">
              All attendees, media, and data will be permanently removed
            </p>
          </div>
          {canDelete ? (
            <ConfirmModal
              title="Delete event?"
              description={confirmDescription}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  className="shrink-0"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete event
                </Button>
              }
              confirmLabel="Yes, delete event"
              variant="destructive"
              onConfirm={handleDelete}
              isLoading={isPending}
            />
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled
              className="shrink-0"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete event
            </Button>
          )}
        </div>
        {blockedReason && (
          <Alert variant="info" className="mt-3">
            <Info className="size-4" />
            <AlertDescription>{blockedReason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
