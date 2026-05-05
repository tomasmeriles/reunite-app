import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FormContainer, FormPasswordField } from '~/components/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { LoadingButton } from '~/components/buttons';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '~/lib/schemas/auth.schema';

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (_values: ResetPasswordFormValues) => {
    // TODO: wire up once backend exposes POST /auth/reset-password
    toast.success(t('resetPassword.success'));
    navigate({ to: '/login', replace: true });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          {t('resetPassword.title')}
        </CardTitle>
        <CardDescription>{t('resetPassword.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormPasswordField
            control={form.control}
            name="password"
            label={t('resetPassword.password')}
            autoComplete="new-password"
          />
          <FormPasswordField
            control={form.control}
            name="confirmPassword"
            label={t('resetPassword.confirmPassword')}
            autoComplete="new-password"
          />
          <LoadingButton
            loadingText={t('resetPassword.submitting')}
            isLoading={false}
            type="submit"
            className="w-full"
          >
            {t('resetPassword.submit')}
          </LoadingButton>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('resetPassword.backToSignIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
