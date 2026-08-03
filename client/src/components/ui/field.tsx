import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  ...props
}: React.ComponentProps<'legend'>) {
  return (
    <legend
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

function Field({
  className,
  ...props
}: React.ComponentProps<'div'> & { 'data-invalid'?: boolean }) {
  return (
    <div
      role="group"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  errors,
  ...props
}: React.ComponentProps<'p'> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const message = errors?.find((e) => e?.message)?.message;
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {message}
    </p>
  );
}

export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
};
