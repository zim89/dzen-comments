import { z } from 'zod';

const userNameRegex = /^[a-zA-Z0-9]+$/;

export const commentFormSchema = z.object({
  userName: z
    .string()
    .min(1, 'Имя обязательно')
    .max(100, 'Не более 100 символов')
    .regex(userNameRegex, 'Только латиница и цифры'),
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email')
    .max(255, 'Не более 255 символов'),
  homePage: z
    .string()
    .max(2048, 'Не более 2048 символов')
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Некорректный URL',
    }),
  text: z
    .string()
    .min(1, 'Текст обязателен')
    .max(10000, 'Не более 10000 символов'),
  captchaValue: z
    .string()
    .min(1, 'Введите CAPTCHA')
    .max(20, 'Не более 20 символов'),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email обязателен').email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
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
  if (bytes >= 1024 * 1024) return `${bytes / (1024 * 1024)} МБ`;
  return `${bytes / 1024} КБ`;
}
