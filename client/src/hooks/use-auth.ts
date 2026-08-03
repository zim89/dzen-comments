import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { useAuth } from '@/providers/auth-provider';
import type { LoginFormValues } from '@/schemas/comment';

export function useLoginMutation() {
  const { setToken } = useAuth();

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (data) => setToken(data.accessToken),
  });
}
