import { randomUUID } from 'crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Attachment, AttachmentType } from '@prisma/client';
import { Queue } from 'bullmq';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_TEXT_MIME_TYPES,
  FILES_QUEUE,
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_WIDTH,
  MAX_UPLOAD_BYTES,
  RESIZE_IMAGE_JOB,
  TEXT_MAX_BYTES,
  UPLOADS_DIR,
  type ResizeImageJobData,
} from './files.constants';
import {
  FILE_PROCESSED_EVENT,
  FileProcessedEvent,
} from './events/file-processed.event';
import { AttachmentResponse } from './files.types';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsPath = join(process.cwd(), UPLOADS_DIR);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(FILES_QUEUE) private readonly filesQueue: Queue,
  ) {}

  onModuleInit(): void {
    if (!existsSync(this.uploadsPath)) {
      mkdirSync(this.uploadsPath, { recursive: true });
      this.logger.log(`Created uploads directory at ${this.uploadsPath}`);
    }
  }

  async attachToComment(
    commentId: string,
    file: Express.Multer.File,
  ): Promise<AttachmentResponse> {
    this.validateFile(file);

    const type = this.resolveAttachmentType(file.mimetype);
    const extension = this.resolveExtension(file.mimetype, file.originalname);
    const storedName = `${randomUUID()}${extension}`;
    const filePath = join(this.uploadsPath, storedName);

    writeFileSync(filePath, file.buffer);

    const attachment = await this.prisma.attachment.create({
      data: {
        commentId,
        type,
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    if (type === AttachmentType.IMAGE) {
      await this.filesQueue.add(RESIZE_IMAGE_JOB, {
        attachmentId: attachment.id,
      } satisfies ResizeImageJobData);
    }

    return this.toAttachmentResponse(attachment);
  }

  async resizeImage(attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.type !== AttachmentType.IMAGE) {
      this.logger.warn(
        `Skip resize: attachment ${attachmentId} not found or not image`,
      );
      return;
    }

    const filePath = join(this.uploadsPath, attachment.storedName);
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const resized = await image
      .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer({ resolveWithObject: true });

    writeFileSync(filePath, resized.data);

    const updated = await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        width: resized.info.width,
        height: resized.info.height,
        size: resized.data.length,
      },
    });

    this.eventEmitter.emit(
      FILE_PROCESSED_EVENT,
      new FileProcessedEvent(updated.id),
    );

    this.logger.log(
      `Image resized: ${attachmentId} (${metadata.width ?? '?'}x${metadata.height ?? '?'} → ${updated.width}x${updated.height})`,
    );
  }

  async getAttachmentFile(id: string): Promise<{
    attachment: Attachment;
    stream: ReturnType<typeof createReadStream>;
  }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`File with id "${id}" not found`);
    }

    const filePath = join(this.uploadsPath, attachment.storedName);

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        `Stored file for attachment "${id}" not found`,
      );
    }

    return {
      attachment,
      stream: createReadStream(filePath),
    };
  }

  toAttachmentResponse(attachment: Attachment): AttachmentResponse {
    return {
      id: attachment.id,
      type: attachment.type,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      width: attachment.width,
      height: attachment.height,
      url: `/files/${attachment.id}`,
    };
  }

  deleteStoredFile(storedName: string): void {
    const filePath = join(this.uploadsPath, storedName);

    if (!existsSync(filePath)) {
      return;
    }

    unlinkSync(filePath);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('File is empty');
    }

    const isImage = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype);
    const isText = ALLOWED_TEXT_MIME_TYPES.has(file.mimetype);

    if (!isImage && !isText) {
      throw new BadRequestException(
        'File type is not allowed. Allowed: JPG, PNG, GIF, TXT',
      );
    }

    if (isText && file.size > TEXT_MAX_BYTES) {
      throw new BadRequestException(
        `Text file must not exceed ${TEXT_MAX_BYTES} bytes`,
      );
    }

    if (isImage && file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `Image file must not exceed ${MAX_UPLOAD_BYTES} bytes`,
      );
    }
  }

  private resolveAttachmentType(mimeType: string): AttachmentType {
    if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return AttachmentType.IMAGE;
    }

    return AttachmentType.TEXT;
  }

  private resolveExtension(mimeType: string, originalName: string): string {
    const fromName = originalName.includes('.')
      ? `.${originalName.split('.').pop()?.toLowerCase()}`
      : '';

    const mimeExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'text/plain': '.txt',
    };

    const fromMime = mimeExtensions[mimeType];

    if (fromMime) {
      return fromMime;
    }

    return fromName || '';
  }
}
