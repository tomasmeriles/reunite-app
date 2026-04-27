import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
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
  useInviteLinks,
  useCreateInviteLink,
  useDeleteInviteLink,
} from '~/hooks/api/use-invite-links';
import { useEventAccess } from '~/hooks/use-permission';
import { getApiErrorMessage } from '~/lib/axios';
import type { Event } from '~/api/events/events.types';

interface EventInviteLinksCardProps {
  event: Event;
}

export function EventInviteLinksCard({ event }: EventInviteLinksCardProps) {
  const { canManageInvites } = useEventAccess(event.id);
  const { data: inviteLinks } = useInviteLinks(event.id);
  const { mutate: createLink, isPending: creating } = useCreateInviteLink(event.id);
  const { mutate: deleteLink } = useDeleteInviteLink(event.id);

  const [label, setLabel] = useState('');

  const handleCreate = () => {
    createLink(
      { label: label.trim() || undefined },
      {
        onSuccess: () => {
          setLabel('');
          toast.success('Invite link created');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite links</CardTitle>
        <CardDescription>
          Share these so guests can join the event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManageInvites && (
          <div className="flex gap-2">
            <Input
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              size="sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        )}

        {inviteLinks && inviteLinks.length > 0 ? (
          <div className="space-y-2">
            {inviteLinks.map((link) => {
              const linkUrl = `${window.location.origin}/join/${link.token}`;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {link.label ?? 'Untitled link'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.useCount} use{link.useCount !== 1 ? 's' : ''}
                      {link.maxUses ? ` / ${link.maxUses} max` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard.writeText(linkUrl);
                        toast.success('Copied!');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {canManageInvites && (
                      <ConfirmModal
                        title="Delete invite link?"
                        description="Anyone who already used this link will keep their access."
                        trigger={
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        confirmLabel="Delete link"
                        variant="destructive"
                        onConfirm={() => deleteLink(link.id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No invite links yet. Create one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
