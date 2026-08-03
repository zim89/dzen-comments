import { FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FileUploadPreviewProps = {
  file: File;
  onClear: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function FileUploadPreview({ file, onClear }: FileUploadPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    let cancelled = false;

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(null);

    if (file.type === 'text/plain') {
      void file.text().then((text) => {
        if (!cancelled) setTextPreview(text);
      });
    } else {
      setTextPreview(null);
    }

    return () => {
      cancelled = true;
    };
  }, [file, isImage]);

  return (
    <div className='rounded-md border bg-muted/30 p-3'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <p className='truncate text-sm font-medium'>{file.name}</p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {formatFileSize(file.size)}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={onClear}
            title='Remove file'
          >
            <X className='size-4' />
          </Button>
        </div>
      </div>

      {isImage && previewUrl && (
        <>
          <button
            type='button'
            onClick={() => setLightboxOpen(true)}
            className='block overflow-hidden rounded-md border bg-background transition-opacity hover:opacity-90'
          >
            <img
              src={previewUrl}
              alt={file.name}
              className='max-h-40 max-w-full object-contain'
            />
          </button>

          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className='max-w-4xl'>
              <DialogHeader>
                <DialogTitle>{file.name}</DialogTitle>
              </DialogHeader>
              <img
                src={previewUrl}
                alt={file.name}
                className='max-h-[70vh] w-full object-contain'
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {file.type === 'text/plain' && (
        <div className='flex gap-3 rounded-md border bg-background p-3'>
          <FileText className='mt-0.5 size-5 shrink-0 text-muted-foreground' />
          <pre className='max-h-32 overflow-auto whitespace-pre-wrap wrap-break-word text-xs text-muted-foreground'>
            {textPreview ?? 'Loading...'}
          </pre>
        </div>
      )}
    </div>
  );
}
