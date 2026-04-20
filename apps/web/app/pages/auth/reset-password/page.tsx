import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { FormContainer, FormPasswordField } from '~/components/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '~/lib/schemas/auth.schema';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (_values: ResetPasswordFormValues) => {
    // TODO: wire up once backend exposes POST /auth/reset-password
    toast.success('Password reset successfully!');
    navigate({ to: '/login', replace: true });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          Set new password
        </CardTitle>
        <CardDescription>
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormPasswordField
            control={form.control}
            name="password"
            label="New password"
            autoComplete="new-password"
          />
          <FormPasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full">
            Reset password
          </Button>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            ← Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
