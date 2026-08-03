import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Attachment } from '@/types/api';
import { fileUrl } from '@/lib/utils';

const IMAGE_RETRY_LIMIT = 3;
const IMAGE_RETRY_DELAY_MS = 400;

type AttachmentViewProps = {
  attachment: Attachment;
};

export function AttachmentView({ attachment }: AttachmentViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cacheKey = `${attachment.width ?? 'pending'}-${attachment.height ?? 'pending'}-${retryCount}`;
  const url = `${fileUrl(attachment.url)}?v=${encodeURIComponent(cacheKey)}`;

  const handleImageError = () => {
    if (retryCount >= IMAGE_RETRY_LIMIT) {
      return;
    }

    window.setTimeout(() => {
      setRetryCount((count) => count + 1);
    }, IMAGE_RETRY_DELAY_MS);
  };

  if (attachment.type === 'TEXT') {
    return (
      <a
        href={fileUrl(attachment.url)}
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
          key={cacheKey}
          src={url}
          alt={attachment.originalName}
          className="max-h-60 max-w-full object-contain"
          loading="lazy"
          onError={handleImageError}
        />
      </button>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{attachment.originalName}</DialogTitle>
          </DialogHeader>
          <img
            key={`lightbox-${cacheKey}`}
            src={url}
            alt={attachment.originalName}
            className="max-h-[70vh] w-full object-contain"
            onError={handleImageError}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
