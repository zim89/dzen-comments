import { z } from 'zod';

const userNameRegex = /^[a-zA-Z0-9]+$/;

export const commentFormSchema = z.object({
  userName: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, 'Username is required')
        .max(100, 'Must be at most 100 characters')
        .regex(userNameRegex, 'Latin letters and digits only'),
    ),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email')
    .max(255, 'Must be at most 255 characters'),
  homePage: z
    .string()
    .max(2048, 'Must be at most 2048 characters')
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Invalid URL',
    }),
  text: z
    .string()
    .min(1, 'Text is required')
    .max(10000, 'Must be at most 10000 characters'),
  captchaValue: z
    .string()
    .min(1, 'Enter CAPTCHA')
    .max(20, 'Must be at most 20 characters'),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_TEXT_FILE_SIZE = 100 * 1024;

export function getMaxFileSize(mimeType: string): number {
  return mimeType === 'text/plain' ? MAX_TEXT_FILE_SIZE : MAX_IMAGE_SIZE;
}

export function formatMaxFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${bytes / (1024 * 1024)} MB`;
  return `${bytes / 1024} KB`;
}
