import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FILES_QUEUE } from './files.constants';
import { FilesController } from './files.controller';
import { FilesProcessor } from './files.processor';
import { FilesService } from './files.service';
import { FileProcessedListener } from './listeners/file-processed.listener';

@Module({
  imports: [BullModule.registerQueue({ name: FILES_QUEUE })],
  controllers: [FilesController],
  providers: [FilesService, FilesProcessor, FileProcessedListener],
  exports: [FilesService],
})
export class FilesModule {}
