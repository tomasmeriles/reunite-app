import { useState } from 'react';
import { Clock, Copy, Link, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { EmptyState } from '~/components/ui/empty-state';
import { Spinner } from '~/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Modal, ModalFooter } from '~/components/ui/modal';
import {
  FormContainer,
  FormTextField,
  FormDateTimeField,
  FormNumberField,
} from '~/components/forms';
import { LoadingButton } from '~/components/buttons/loading-button';
import {
  useInviteLinks,
  useCreateInviteLink,
  useDeleteInviteLink,
} from '~/hooks/api/use-invite-links';
import { useApiError } from '~/hooks/use-api-error';
import { formatDateTime, localISOToEventISO } from '~/lib/datetime';
import type { Event } from '~/api/events/events.types';
import {
  createInviteLinkSchema,
  type CreateInviteLinkFormValues,
} from '~/lib/schemas/invite-link.schema';

interface InviteLinksCardProps {
  event: Event;
}

function joinUrl(token: string) {
  return `${window.location.origin}/join/${token}`;
}

function UsageBadge({
  useCount,
  maxUses,
}: {
  useCount: number;
  maxUses: number | null;
}) {
  const label =
    maxUses === null ? `${useCount} uses` : `${useCount} / ${maxUses} uses`;
  const isNearLimit = maxUses !== null && useCount >= maxUses * 0.8;
  return (
    <Badge
      variant={isNearLimit ? 'destructive' : 'secondary'}
      className="text-xs"
    >
      {label}
    </Badge>
  );
}

export function InviteLinksCard({ event }: InviteLinksCardProps) {
  const apiError = useApiError();
  const { data: links, isLoading } = useInviteLinks(event.id);
  const { mutate: createLink, isPending: creating } = useCreateInviteLink(
    event.id,
  );
  const { mutate: deleteLink } = useDeleteInviteLink(event.id);

  const [open, setOpen] = useState(false);

  const form = useForm<CreateInviteLinkFormValues>({
    resolver: zodResolver(createInviteLinkSchema),
    defaultValues: { label: '', maxUses: undefined, expiresAt: '' },
  });

  function handleOpenChange(value: boolean) {
    if (!value) form.reset();
    setOpen(value);
  }

  function onSubmit(values: CreateInviteLinkFormValues) {
    const payload = {
      ...values,
      expiresAt: values.expiresAt
        ? localISOToEventISO(values.expiresAt, event.timezone)
        : undefined,
    };

    createLink(payload, {
      onSuccess: () => {
        toast.success('Invite link created');
        handleOpenChange(false);
      },
      onError: (err) =>
        toast.error(apiError(err)),
    });
  }

  const handleCopy = (token: string) => {
    void navigator.clipboard.writeText(joinUrl(token));
    toast.success('Link copied!');
  };

  const handleDelete = (linkId: string) => {
    deleteLink(linkId, {
      onSuccess: () => toast.success('Link deleted'),
      onError: (err) =>
        toast.error(apiError(err)),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Invite links</CardTitle>
              <CardDescription>
                Anyone with a link can join. Create multiple links to track
                different groups.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : !links?.length ? (
            <EmptyState
              icon={Link}
              message="No invite links yet."
              description="Create one to start inviting people."
            />
          ) : (
            <ul className="space-y-3">
              {links.map((link, i) => {
                const isExpired =
                  !!link.expiresAt && new Date(link.expiresAt) < new Date();
                return (
                  <li key={link.id}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div
                      className={`flex items-start justify-between gap-3 ${isExpired ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        {link.label ? (
                          <p className="text-sm font-medium">{link.label}</p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            Unnamed link
                          </p>
                        )}
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {joinUrl(link.token)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <UsageBadge
                            useCount={link.useCount}
                            maxUses={link.maxUses}
                          />
                          {link.expiresAt &&
                            (isExpired ? (
                              <Badge
                                variant="destructive"
                                className="gap-1 text-xs"
                              >
                                <Clock className="h-3 w-3" />
                                Expired{' '}
                                {formatDateTime(
                                  link.expiresAt,
                                  'd LLL yyyy, HH:mm',
                                  event.timezone ?? undefined,
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Expires{' '}
                                {formatDateTime(
                                  link.expiresAt,
                                  'd LLL yyyy, HH:mm',
                                  event.timezone ?? undefined,
                                )}
                              </Badge>
                            ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleCopy(link.token)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy link</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete link</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Create invite link"
        description="All fields are optional. Leave them blank to create a simple unlimited link."
        size="sm"
      >
        <FormContainer form={form} onSubmit={onSubmit} className="space-y-4">
          <FormTextField
            control={form.control}
            name="label"
            label="Label"
            optional
            placeholder="e.g. Friends from work"
          />

          <FormNumberField
            control={form.control}
            name="maxUses"
            label="Max uses"
            placeholder="Unlimited"
            optional
            min={1}
          />

          <FormDateTimeField
            control={form.control}
            name="expiresAt"
            label="Expires at"
            optional
            disablePast
          />

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={creating}>
              Create link
            </LoadingButton>
          </ModalFooter>
        </FormContainer>
      </Modal>
    </>
  );
}
