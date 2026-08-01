import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { FilesService } from './files.service';

@Public()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getFile(@Param('id') id: string): Promise<StreamableFile> {
    const { attachment, stream } =
      await this.filesService.getAttachmentFile(id);

    return new StreamableFile(stream, {
      type: attachment.mimeType,
      disposition: `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      length: attachment.size,
    });
  }
}
