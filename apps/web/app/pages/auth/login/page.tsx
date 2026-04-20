import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
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
import { GoogleButton } from '~/components/buttons';
import { useLogin } from '~/hooks/api/use-auth';
import { loginSchema, type LoginFormValues } from '~/lib/schemas/auth.schema';
import { getApiErrorMessage } from '~/lib/axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => navigate({ to: '/dashboard', replace: true }),
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Invalid email or password')),
    });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          Sign in
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your account
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
          <FormPasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </FormContainer>
        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/70 px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>
        <GoogleButton />
        <div className="mt-4 flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
          <span>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
