import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  FILES_QUEUE,
  RESIZE_IMAGE_JOB,
  type ResizeImageJobData,
} from './files.constants';
import { FilesService } from './files.service';

@Processor(FILES_QUEUE)
export class FilesProcessor extends WorkerHost {
  private readonly logger = new Logger(FilesProcessor.name);

  constructor(private readonly filesService: FilesService) {
    super();
  }

  async process(job: Job<ResizeImageJobData>): Promise<void> {
    if (job.name === RESIZE_IMAGE_JOB) {
      await this.filesService.resizeImage(job.data.attachmentId);
      return;
    }

    this.logger.warn(`Unknown job name: ${job.name}`);
  }
}
