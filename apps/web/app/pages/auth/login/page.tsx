import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Separator } from '~/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormContainer,
  FormTextField,
  FormPasswordField,
} from '~/components/forms';
// import { GoogleButton } from '~/components/buttons'; // [GOOGLE_OAUTH_DISABLED]
import { LoadingButton } from '~/components/buttons';
import { useLogin } from '~/hooks/api/use-auth';
import { loginSchema, type LoginFormValues } from '~/lib/schemas/auth.schema';
import { useApiError } from '~/hooks/use-api-error';

function useHasGuestTokens(): boolean {
  return useMemo(() => {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('guest_token_')) return true;
    }
    return false;
  }, []);
}

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  const hasGuestTokens = useHasGuestTokens();
  const apiError = useApiError();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => navigate({ to: '/dashboard', replace: true }),
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          {t('login.title')}
        </CardTitle>
        <CardDescription>{t('login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasGuestTokens && (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground mb-4">
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>{t('login.guestNote')}</span>
          </div>
        )}
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormTextField
            control={form.control}
            name="email"
            label={t('login.email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormPasswordField
            control={form.control}
            name="password"
            label={t('login.password')}
            autoComplete="current-password"
          />
          <LoadingButton
            loadingText={t('login.submitting')}
            isLoading={isPending}
            type="submit"
            className="w-full"
          >
            {t('login.submit')}
          </LoadingButton>
        </FormContainer>
        {/* [GOOGLE_OAUTH_DISABLED] — separator + GoogleButton removed */}
        <div className="mt-4 flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
          <span>
            {t('login.noAccount')}{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t('login.signUp')}
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
