import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { ConfirmModal } from '~/components/ui/modal';
import {
  useWhitelist,
  useAddToWhitelist,
  useRemoveFromWhitelist,
} from '~/hooks/api/use-whitelist';
import { getApiErrorMessage } from '~/lib/axios';
import type { Event } from '~/api/events/events.types';

interface EventGuestListCardProps {
  event: Event;
}

export function EventGuestListCard({ event }: EventGuestListCardProps) {
  const { data: whitelist } = useWhitelist(event.id);
  const { mutate: addToWhitelist, isPending: adding } = useAddToWhitelist(event.id);
  const { mutate: removeFromWhitelist } = useRemoveFromWhitelist(event.id);

  const [username, setUsername] = useState('');

  const handleAdd = () => {
    if (!username.trim()) return;
    addToWhitelist(
      { username: username.trim().replace(/^@/, '') },
      {
        onSuccess: () => {
          setUsername('');
          toast.success('User added to guest list');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest list</CardTitle>
        <CardDescription>
          Only users on this list can join the event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            size="sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {whitelist && whitelist.length > 0 ? (
          <div className="space-y-2">
            {whitelist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {entry.user.avatar ? (
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.username}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {entry.user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.user.name ?? entry.user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{entry.user.username}
                    </p>
                  </div>
                </div>
                <ConfirmModal
                  title="Remove from guest list?"
                  description={
                    <>
                      <strong>{entry.user.name ?? entry.user.username}</strong>{' '}
                      will lose access to this event.
                    </>
                  }
                  trigger={
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  confirmLabel="Remove"
                  variant="destructive"
                  onConfirm={() => removeFromWhitelist(entry.userId)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No one on the guest list yet. Add a username above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
