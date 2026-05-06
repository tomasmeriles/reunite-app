import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
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
import { useRegister } from '~/hooks/api/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '~/lib/schemas/auth.schema';
import { useApiError } from '~/hooks/use-api-error';

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const apiError = useApiError();
  const navigate = useNavigate();
  const { mutate: register, isPending } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', name: '', username: '', password: '' },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register(values, {
      onSuccess: () => navigate({ to: '/dashboard', replace: true }),
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          {t('register.title')}
        </CardTitle>
        <CardDescription>{t('register.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* [GOOGLE_OAUTH_DISABLED] — GoogleButton removed */}
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormTextField
            control={form.control}
            name="name"
            label={t('register.name')}
            placeholder="John Doe"
            autoComplete="name"
          />
          <FormTextField
            control={form.control}
            name="email"
            label={t('register.email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormTextField
            control={form.control}
            name="username"
            label={t('register.username')}
            placeholder="yourhandle"
            autoComplete="username"
          />
          <FormPasswordField
            control={form.control}
            name="password"
            label={t('register.password')}
            autoComplete="new-password"
          />
          <LoadingButton
            loadingText={t('register.submitting')}
            isLoading={isPending}
            type="submit"
            className="w-full"
          >
            {t('register.submit')}
          </LoadingButton>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('register.alreadyHaveAccount')}{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('register.signIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
