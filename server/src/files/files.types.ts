export type AttachmentResponse = {
  id: string;
  type: 'IMAGE' | 'TEXT';
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
};
