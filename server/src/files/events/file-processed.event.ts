export const FILE_PROCESSED_EVENT = 'file.processed';

export class FileProcessedEvent {
  constructor(public readonly attachmentId: string) {}
}
