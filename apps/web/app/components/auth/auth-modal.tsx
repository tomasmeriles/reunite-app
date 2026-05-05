import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import {
  FormContainer,
  FormTextField,
  FormPasswordField,
} from '~/components/forms';
import { useLogin, useRegister } from '~/hooks/api/use-auth';
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '~/lib/schemas/auth.schema';
import { useApiError } from '~/hooks/use-api-error';
import env from '~/env';
import { GoogleButton } from '~/components/buttons';

// ─── Login form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  onSuccess: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation('auth');
  const { mutate: login, isPending } = useLogin();
  const apiError = useApiError();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess,
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <div className="space-y-4">
      <FormContainer form={form} onSubmit={onSubmit}>
        <FormTextField
          control={form.control}
          name="email"
          label={t('login.email')}
          type="email"
          placeholder={t('login.emailPlaceholder')}
          autoComplete="email"
        />
        <FormPasswordField
          control={form.control}
          name="password"
          label={t('login.password')}
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('login.submitting') : t('login.submit')}
        </Button>
      </FormContainer>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
          {t('login.or')}
        </span>
      </div>
      <GoogleButton />
    </div>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

interface RegisterFormProps {
  onSuccess: () => void;
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation('auth');
  const { mutate: register, isPending } = useRegister();
  const apiError = useApiError();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', name: '', username: '', password: '' },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register(values, {
      onSuccess,
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <div className="space-y-4">
      <FormContainer form={form} onSubmit={onSubmit}>
        <FormTextField
          control={form.control}
          name="name"
          label={t('register.name')}
          placeholder={t('register.namePlaceholder')}
          autoComplete="name"
        />
        <FormTextField
          control={form.control}
          name="email"
          label={t('register.email')}
          type="email"
          placeholder={t('register.emailPlaceholder')}
          autoComplete="email"
        />
        <FormTextField
          control={form.control}
          name="username"
          label={t('register.username')}
          placeholder={t('register.usernamePlaceholder')}
          autoComplete="username"
        />
        <FormPasswordField
          control={form.control}
          name="password"
          label={t('register.password')}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('register.submitting') : t('register.submit')}
        </Button>
      </FormContainer>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
          {t('register.or')}
        </span>
      </div>
      <GoogleButton />
    </div>
  );
}

// ─── AuthModal ────────────────────────────────────────────────────────────────

export type AuthModalTab = 'login' | 'register';

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: AuthModalTab;
  /**
   * Called after a successful login or registration.
   * The modal is already closed when this fires.
   */
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = 'login',
  onSuccess,
}: AuthModalProps) {
  const { t } = useTranslation('auth');

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  // When the modal is closed externally, reset nothing — the forms unmount naturally.
  // When defaultTab changes while open, the Tabs component re-reads the new value.
  useEffect(() => {
    // no-op — kept for future extension (e.g. analytics)
  }, [open]);

  return (
    // TODO: Use modal component instead of dialog
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('modal.welcome', { appName: env.VITE_APP_NAME })}
          </DialogTitle>
          <DialogDescription>
            {t('modal.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Tabs key={defaultTab} defaultValue={defaultTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              {t('login.title')}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              {t('register.title')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <RegisterForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
