import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { useLogin, useRegister } from '~/hooks/api/use-auth';
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '~/lib/schemas/auth.schema';
import { getApiErrorMessage } from '~/lib/axios';
import env from '~/env';
import { GoogleButton } from '~/components/buttons';

// ─── Login form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  onSuccess: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess,
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Invalid email or password')),
    });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
          or
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
  const { mutate: register, isPending } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', name: '', username: '', password: '' },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register(values, {
      onSuccess,
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Registration failed')),
    });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="yourhandle"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
          or
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Welcome to {env.VITE_APP_NAME}
          </DialogTitle>
          <DialogDescription>
            Sign in or create an account to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs key={defaultTab} defaultValue={defaultTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Create account
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
