import { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import {
  useEvent,
  useUpdateEventStatus,
  useUploadEventCover,
  useDeleteEvent,
} from '~/hooks/api/use-events';
import {
  useInviteLinks,
  useCreateInviteLink,
  useDeleteInviteLink,
} from '~/hooks/api/use-invite-links';
import {
  useWhitelist,
  useAddToWhitelist,
  useRemoveFromWhitelist,
} from '~/hooks/api/use-whitelist';
import {
  usePrizes,
  useCreatePrize,
  useAssignWinner,
  useDeletePrize,
} from '~/hooks/api/use-prizes';
import { useAttendees } from '~/hooks/api/use-attendance';
import { getApiErrorMessage } from '~/lib/axios';
import { PrizeList } from '~/components/events/prize-list';
import { AttendeeList } from '~/components/events/attendee-list';
import type { EventStatus } from '~/api/events/events.types';

const PUBLISHABLE_STATUSES: EventStatus[] = [
  'PUBLISHED',
  'ACTIVE',
  'CANCELLED',
  'ENDED',
];

export default function EventManagePage() {
  const { id } = useParams({ from: '/app/events/$id/manage' });
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id);
  const { data: inviteLinks } = useInviteLinks(id);
  const { data: whitelist } = useWhitelist(id);
  const { mutate: updateStatus, isPending: updatingStatus } =
    useUpdateEventStatus(id);
  const { mutate: uploadCover, isPending: uploadingCover } =
    useUploadEventCover(id);
  const { mutate: deleteEvent, isPending: deletingEvent } = useDeleteEvent();
  const { mutate: createLink, isPending: creatingLink } =
    useCreateInviteLink(id);
  const { mutate: deleteLink } = useDeleteInviteLink(id);
  const { mutate: addToWhitelist, isPending: addingToWhitelist } =
    useAddToWhitelist(id);
  const { mutate: removeFromWhitelist } = useRemoveFromWhitelist(id);

  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newUsername, setNewUsername] = useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const handleStatusChange = (status: EventStatus) => {
    updateStatus(
      { status },
      {
        onSuccess: () => toast.success(`Status updated to ${status}`),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadCover(file, {
      onSuccess: () => toast.success('Cover image updated'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This cannot be undone.',
      )
    )
      return;
    deleteEvent(id, {
      onSuccess: () => {
        toast.success('Event deleted');
        navigate({ to: '/dashboard' });
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleCreateLink = () => {
    createLink(
      { label: newLinkLabel || undefined },
      {
        onSuccess: () => {
          setNewLinkLabel('');
          toast.success('Invite link created');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleAddToWhitelist = () => {
    if (!newUsername.trim()) return;
    addToWhitelist(
      { username: newUsername.trim().replace(/^@/, '') },
      {
        onSuccess: () => {
          setNewUsername('');
          toast.success('User added to whitelist');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const eventUrl = `${window.location.origin}/events/${id}`;

  return (
    <>
      <Helmet>
        <title>Manage · {event.title} — Reunite</title>
      </Helmet>

      <div className="mx-auto max-w-4xl space-y-6 py-8 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Event management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/events/$id" params={{ id }}>
                View event
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingEvent}
            >
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {event.eventType === 'INVITE_LINK' && (
              <TabsTrigger value="links">Invite Links</TabsTrigger>
            )}
            {event.eventType === 'INVITE_ACCOUNT' && (
              <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            )}
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Badge>{event.status}</Badge>
                <Select
                  onValueChange={(v) => handleStatusChange(v as EventStatus)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change status…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PUBLISHABLE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.coverImage && (
                  <img
                    src={event.coverImage}
                    alt="Cover"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input readOnly value={eventUrl} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(eventUrl);
                      toast.success('Copied!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Invite Links ── */}
          {event.eventType === 'INVITE_LINK' && (
            <TabsContent value="links" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Invite Link</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Input
                    placeholder="Label (optional)"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                  />
                  <Button onClick={handleCreateLink} disabled={creatingLink}>
                    Create
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {inviteLinks?.map((link) => {
                  const linkUrl = `${window.location.origin}/join/${link.token}`;
                  return (
                    <Card key={link.id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">
                            {link.label ?? 'Untitled link'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {link.useCount} uses
                            {link.maxUses ? ` / ${link.maxUses}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(linkUrl);
                              toast.success('Copied!');
                            }}
                          >
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteLink(link.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* ── Whitelist ── */}
          {event.eventType === 'INVITE_ACCOUNT' && (
            <TabsContent value="whitelist" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add to Whitelist</CardTitle>
                  <CardDescription>
                    Enter a @username to grant them access
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Input
                    placeholder="@username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddToWhitelist();
                    }}
                  />
                  <Button
                    onClick={handleAddToWhitelist}
                    disabled={addingToWhitelist}
                  >
                    Add
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {whitelist?.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {entry.user.avatar && (
                          <img
                            src={entry.user.avatar}
                            alt={entry.user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {entry.user.name ?? entry.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{entry.user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromWhitelist(entry.userId)}
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* ── Attendees ── */}
          <TabsContent value="attendees" className="mt-4">
            <AttendeeList eventId={id} />
          </TabsContent>

          {/* ── Prizes ── */}
          <TabsContent value="prizes" className="mt-4">
            <PrizeList eventId={id} canManage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
