import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  FILE_PROCESSED_EVENT,
  FileProcessedEvent,
} from '../events/file-processed.event';

@Injectable()
export class FileProcessedListener {
  private readonly logger = new Logger(FileProcessedListener.name);

  @OnEvent(FILE_PROCESSED_EVENT)
  handleFileProcessed(event: FileProcessedEvent): void {
    this.logger.log(`File processed: ${event.attachmentId}`);
  }
}
