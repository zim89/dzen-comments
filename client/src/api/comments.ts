import type {
  CaptchaResponse,
  Comment,
  CommentsQuery,
  PaginatedComments,
  PreviewResponse,
} from '@/types/api';
import { apiFetch, apiFormData } from '@/lib/api-client';
import type { CommentFormValues } from '@/schemas/comment';

function buildQuery(params: CommentsQuery): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortField) search.set('sortField', params.sortField);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function fetchComments(query: CommentsQuery): Promise<PaginatedComments> {
  return apiFetch(`/comments${buildQuery(query)}`);
}

export function fetchComment(id: string): Promise<Comment> {
  return apiFetch(`/comments/${id}`);
}

export function fetchCaptcha(): Promise<CaptchaResponse> {
  return apiFetch('/captcha');
}

export function previewComment(text: string): Promise<PreviewResponse> {
  return apiFetch('/comments/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

function buildCommentFormData(
  values: CommentFormValues,
  captchaId: string,
  file?: File | null,
): FormData {
  const formData = new FormData();
  formData.append('userName', values.userName);
  formData.append('email', values.email);
  formData.append('text', values.text);
  formData.append('captchaId', captchaId);
  formData.append('captchaValue', values.captchaValue);
  if (values.homePage) formData.append('homePage', values.homePage);
  if (file) formData.append('file', file);
  return formData;
}

export function createComment(
  values: CommentFormValues,
  captchaId: string,
  file?: File | null,
): Promise<Comment> {
  return apiFormData(
    '/comments',
    buildCommentFormData(values, captchaId, file),
  );
}

export function createReply(
  parentId: string,
  values: CommentFormValues,
  captchaId: string,
  file?: File | null,
): Promise<Comment> {
  return apiFormData(
    `/comments/${parentId}/replies`,
    buildCommentFormData(values, captchaId, file),
  );
}

export function deleteComment(id: string, token: string): Promise<void> {
  return apiFetch(`/comments/${id}`, {
    method: 'DELETE',
    token,
  });
}
