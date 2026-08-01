import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../auth/decorators/public.decorator';
import { MAX_UPLOAD_BYTES } from '../files/files.constants';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PreviewCommentDto } from './dto/preview-comment.dto';
import { CommentResponse, PaginatedCommentsResponse } from './comments.types';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  create(
    @Body() dto: CreateCommentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CommentResponse> {
    return this.commentsService.create(dto, file);
  }

  @Public()
  @Post('preview')
  preview(@Body() dto: PreviewCommentDto) {
    return this.commentsService.preview(dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: CommentQueryDto): Promise<PaginatedCommentsResponse> {
    return this.commentsService.findAll(query);
  }

  @Public()
  @Post(':id/replies')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  createReply(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CommentResponse> {
    return this.commentsService.createReply(id, dto, file);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CommentResponse> {
    return this.commentsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.commentsService.remove(id);
  }
}
