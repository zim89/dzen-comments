import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLoginMutation } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { loginFormSchema, type LoginFormValues } from '@/schemas/comment';

export function ModeratorAuth() {
  const { isAuthenticated, logout } = useAuth();
  const loginMutation = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut />
        Sign out
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn />
          Moderator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderator sign in</DialogTitle>
          <DialogDescription>
            Sign in to delete comments.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            loginMutation.mutate(values, {
              onSuccess: () => toast.success('Signed in as moderator'),
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : 'Sign in failed',
                ),
            }),
          )}
        >
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="moderator-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="moderator-email"
                    type="email"
                    autoComplete="username"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="moderator-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="moderator-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
