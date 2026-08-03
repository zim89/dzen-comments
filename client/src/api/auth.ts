import type { LoginResponse } from '@/types/api';
import { apiFetch } from '@/lib/api-client';
import type { LoginFormValues } from '@/schemas/comment';

export function login(values: LoginFormValues): Promise<LoginResponse> {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
}
