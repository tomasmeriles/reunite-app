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
import { useRegister } from '~/hooks/api/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '~/lib/schemas/auth.schema';
import { useApiError } from '~/hooks/use-api-error';
import { GoogleButton } from '~/components/buttons';

export default function RegisterPage() {
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
      onError: (err) =>
        toast.error(apiError(err)),
    });
  };

  return (
    <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-transparent">
          Create an account
        </CardTitle>
        <CardDescription>Fill in your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleButton />
        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/70 px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>
        <FormContainer form={form} onSubmit={onSubmit}>
          <FormTextField
            control={form.control}
            name="name"
            label="Full name"
            placeholder="John Doe"
            autoComplete="name"
          />
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormTextField
            control={form.control}
            name="username"
            label="Username"
            placeholder="yourhandle"
            autoComplete="username"
          />
          <FormPasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </FormContainer>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
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
