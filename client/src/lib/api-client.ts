import type { ApiErrorBody } from '@/types/api';
import { apiUrl } from './utils';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // ignore
  }

  if (response.status >= 500) {
    return 'API unavailable. Start the server: cd server && npm run start:dev';
  }

  return response.statusText || 'Request failed';
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...rest,
      headers: {
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(
      'Could not connect to the API. Start the server (npm run start:dev) and docker compose up -d',
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiFormData<T>(
  path: string,
  formData: FormData,
  init?: { method?: string; token?: string | null },
): Promise<T> {
  const { token, method = 'POST' } = init ?? {};

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    throw new ApiError(
      'Could not connect to the API. Start the server (npm run start:dev) and docker compose up -d',
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  return (await response.json()) as T;
}
