export const FILES_QUEUE = 'files';
export const RESIZE_IMAGE_JOB = 'resize-image';

export const UPLOADS_DIR = 'uploads';

export const IMAGE_MAX_WIDTH = 320;
export const IMAGE_MAX_HEIGHT = 240;
export const TEXT_MAX_BYTES = 100 * 1024;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
]);

export const ALLOWED_TEXT_MIME_TYPES = new Set(['text/plain']);

export type ResizeImageJobData = {
  attachmentId: string;
};
