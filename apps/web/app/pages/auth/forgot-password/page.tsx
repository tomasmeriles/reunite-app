import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FormContainer, FormTextField } from '~/components/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { LoadingButton } from '~/components/buttons';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '~/lib/schemas/auth.schema';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (_values: ForgotPasswordFormValues) => {
    // TODO: wire up once backend exposes POST /auth/forgot-password
    toast.info(t('forgotPassword.success'));
    form.reset();
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          {t('forgotPassword.title')}
        </CardTitle>
        <CardDescription>{t('forgotPassword.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormTextField
            control={form.control}
            name="email"
            label={t('forgotPassword.email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <LoadingButton
            loadingText={t('forgotPassword.submitting')}
            isLoading={false}
            type="submit"
            className="w-full"
          >
            {t('forgotPassword.submit')}
          </LoadingButton>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('forgotPassword.rememberPassword')}{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('forgotPassword.signIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
