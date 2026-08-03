import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createComment,
  createReply,
  previewComment,
} from '@/api/comments';
import { HtmlToolbar } from '@/components/comments/html-toolbar';
import { FileUploadPreview } from '@/components/comments/file-upload-preview';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCaptchaQuery, invalidateComments } from '@/hooks/use-comments';
import { ApiError } from '@/lib/api-client';
import {
  ALLOWED_FILE_TYPES,
  formatMaxFileSize,
  getMaxFileSize,
  MAX_IMAGE_SIZE,
  MAX_TEXT_FILE_SIZE,
  commentFormSchema,
  type CommentFormValues,
} from '@/schemas/comment';

type CommentFormProps = {
  parentId?: string;
  onSuccess?: () => void;
  compact?: boolean;
};

const defaultValues: CommentFormValues = {
  userName: '',
  email: '',
  homePage: '',
  text: '',
  captchaValue: '',
};

export function CommentForm({
  parentId,
  onSuccess,
  compact = false,
}: CommentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const {
    data: captcha,
    refetch: refetchCaptcha,
    isFetching: captchaLoading,
  } = useCaptchaQuery();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues,
  });

  const previewMutation = useMutation({
    mutationFn: (text: string) => previewComment(text),
    onSuccess: (data) => setPreviewHtml(data.html),
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Preview failed');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: CommentFormValues) => {
      if (!captcha?.id) {
        throw new Error('CAPTCHA not loaded');
      }
      if (parentId) {
        return createReply(parentId, values, captcha.id, file);
      }
      return createComment(values, captcha.id, file);
    },
    onSuccess: async () => {
      toast.success(parentId ? 'Reply added' : 'Comment added');
      form.reset(defaultValues);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setPreviewHtml(null);
      await invalidateComments(queryClient);
      void refetchCaptcha();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Submit failed');
      void refetchCaptcha();
      form.setValue('captchaValue', '');
    },
  });

  const handleFileChange = (next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(next.type as (typeof ALLOWED_FILE_TYPES)[number])) {
      toast.error('Allowed types: JPG, PNG, GIF, and TXT');
      return;
    }
    const maxSize = getMaxFileSize(next.type);
    if (next.size > maxSize) {
      toast.error(`File must not exceed ${formatMaxFileSize(maxSize)}`);
      return;
    }
    setFile(next);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const content = (
    <form
      onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))}
      className="space-y-4"
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="userName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${parentId ?? 'root'}-userName`}>
                  Username
                </FieldLabel>
                <Input
                  {...field}
                  id={`${parentId ?? 'root'}-userName`}
                  placeholder="user123"
                  autoComplete="username"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Latin letters and digits</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${parentId ?? 'root'}-email`}>Email</FieldLabel>
                <Input
                  {...field}
                  id={`${parentId ?? 'root'}-email`}
                  type="email"
                  placeholder="user@example.com"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="homePage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${parentId ?? 'root'}-homePage`}>
                Home page
              </FieldLabel>
              <Input
                {...field}
                id={`${parentId ?? 'root'}-homePage`}
                type="url"
                placeholder="https://example.com"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>Optional</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="text"
          control={form.control}
          render={({ field: { ref, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${parentId ?? 'root'}-text`}>Text</FieldLabel>
              <HtmlToolbar
                textareaRef={textareaRef}
                value={field.value}
                onChange={field.onChange}
              />
              <Textarea
                {...field}
                ref={(el) => {
                  ref(el);
                  textareaRef.current = el;
                }}
                id={`${parentId ?? 'root'}-text`}
                placeholder="Your comment..."
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <FieldLabel htmlFor={`${parentId ?? 'root'}-file`}>Attachment</FieldLabel>
          <Input
            ref={fileInputRef}
            id={`${parentId ?? 'root'}-file`}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.txt,image/jpeg,image/png,image/gif,text/plain"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <FieldDescription>
            JPG, PNG, GIF up to {formatMaxFileSize(MAX_IMAGE_SIZE)}, TXT up to{' '}
            {formatMaxFileSize(MAX_TEXT_FILE_SIZE)}
          </FieldDescription>
          {file && <FileUploadPreview file={file} onClear={clearFile} />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Controller
            name="captchaValue"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${parentId ?? 'root'}-captcha`}>CAPTCHA</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="flex min-h-16 min-w-40 items-center justify-center rounded-md border bg-muted p-2"
                    dangerouslySetInnerHTML={{
                      __html: captcha?.image ?? '<span>Loading...</span>',
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void refetchCaptcha()}
                    disabled={captchaLoading}
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw className={captchaLoading ? 'animate-spin' : ''} />
                  </Button>
                </div>
                <Input
                  {...field}
                  id={`${parentId ?? 'root'}-captcha`}
                  placeholder="Enter characters"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      {previewHtml !== null && (
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="mb-2 text-sm font-medium">Preview</p>
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-primary [&_code]:rounded [&_code]:bg-muted [&_code]:px-1"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={previewMutation.isPending}
          onClick={() => {
            const text = form.getValues('text');
            if (!text.trim()) {
              toast.error('Enter text to preview');
              return;
            }
            previewMutation.mutate(text);
          }}
        >
          {previewMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Eye />
          )}
          Preview
        </Button>
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending && <Loader2 className="animate-spin" />}
          {parentId ? 'Reply' : 'Submit'}
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New comment</CardTitle>
        <CardDescription>
          Fill out the form. Supported tags: i, strong, code, a.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
