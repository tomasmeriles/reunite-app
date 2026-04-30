import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { Modal, ModalFooter } from '~/components/ui/modal';
import { FormContainer, FormTextField } from '~/components/forms';
import { LoadingButton } from '~/components/buttons/loading-button';
import { useAuth } from '~/contexts/auth';
import { joinSchema, type JoinFormValues } from '~/lib/schemas/join.schema';
import type { EventType } from '~/api/events/events.types';

interface RsvpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: EventType;
  onSubmit: (guestName?: string, inviteToken?: string) => void;
  isLoading: boolean;
  /** "self" (default) = joining yourself; "guest" = adding someone else */
  mode?: 'self' | 'guest';
}

export function RsvpDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  mode = 'self',
}: RsvpDialogProps) {
  const { user } = useAuth();
  const addingForSelf = mode === 'self';

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    form.reset({ name: open && addingForSelf ? (user?.name ?? '') : '' });
  }, [open]);

  function handleSubmit({ name }: JoinFormValues) {
    onSubmit(name);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={addingForSelf ? 'Join this event' : 'Bring a guest'}
      description={
        addingForSelf
          ? user
            ? 'You can use a different name just for this event.'
            : "You'll join as a guest. No account needed!"
          : "Enter the name of the person you're bringing."
      }
      size="sm"
    >
      <FormContainer form={form} onSubmit={handleSubmit} className="space-y-4">
        <FormTextField
          control={form.control}
          name="name"
          label={addingForSelf ? 'Your name' : "Guest's name"}
          placeholder={
            addingForSelf ? (user?.name ?? 'Enter your name') : 'Jane Smith'
          }
          autoFocus
        />

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" isLoading={isLoading} loadingText="Adding…">
            {addingForSelf ? 'Count me in! 🎉' : 'Add guest'}
          </LoadingButton>
        </ModalFooter>
      </FormContainer>
    </Modal>
  );
}
