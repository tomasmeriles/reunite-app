import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { FormContainer, FormTextField } from '~/components/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '~/lib/schemas/auth.schema';

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (_values: ForgotPasswordFormValues) => {
    // TODO: wire up once backend exposes POST /auth/forgot-password
    toast.info(
      'If an account exists with that email, you will receive a reset link shortly.',
    );
    form.reset();
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          Reset your password
        </CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
