import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
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
  /** Called when the unauthenticated user clicks "Sign in" */
  onLoginRequest?: () => void;
}

export function RsvpDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  mode = 'self',
  onLoginRequest,
}: RsvpDialogProps) {
  const { t } = useTranslation('events');
  const { user } = useAuth();
  const addingForSelf = mode === 'self';
  const showLoginPrompt = addingForSelf && !user && !!onLoginRequest;

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
      title={addingForSelf ? t('rsvp.joinTitle') : t('rsvp.bringGuestTitle')}
      description={
        addingForSelf
          ? user
            ? t('rsvp.joinDescLoggedIn')
            : t('rsvp.joinDescGuest')
          : t('rsvp.bringGuestDesc')
      }
      size="sm"
    >
      <FormContainer form={form} onSubmit={handleSubmit} className="space-y-4">
        <FormTextField
          control={form.control}
          name="name"
          label={addingForSelf ? t('rsvp.yourName') : t('rsvp.guestName')}
          placeholder={
            addingForSelf
              ? (user?.name ?? t('rsvp.yourNamePlaceholder'))
              : t('rsvp.guestNamePlaceholder')
          }
          autoFocus
        />

        {showLoginPrompt && (
          <div className="space-y-3">
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
                {t('rsvp.signInPrompt')}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onLoginRequest}
            >
              {t('rsvp.signIn')}
            </Button>
          </div>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t('rsvp.cancel')}
          </Button>
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={t('rsvp.loading')}
          >
            {addingForSelf ? t('rsvp.confirm') : t('rsvp.confirmGuest')}
          </LoadingButton>
        </ModalFooter>
      </FormContainer>
    </Modal>
  );
}
