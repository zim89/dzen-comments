import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Attachment } from '@/types/api';
import { fileUrl } from '@/lib/utils';

type AttachmentViewProps = {
  attachment: Attachment;
};

export function AttachmentView({ attachment }: AttachmentViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const url = fileUrl(attachment.url);

  if (attachment.type === 'TEXT') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        {attachment.originalName}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="mt-2 block overflow-hidden rounded-md border"
      >
        <img
          src={url}
          alt={attachment.originalName}
          className="max-h-60 max-w-full object-contain"
          loading="lazy"
        />
      </button>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{attachment.originalName}</DialogTitle>
          </DialogHeader>
          <img
            src={url}
            alt={attachment.originalName}
            className="max-h-[70vh] w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
