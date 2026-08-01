import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PreviewCommentDto } from './dto/preview-comment.dto';
import { CommentResponse, PaginatedCommentsResponse } from './comments.types';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto): Promise<CommentResponse> {
    return this.commentsService.create(dto);
  }

  @Post('preview')
  preview(@Body() dto: PreviewCommentDto) {
    return this.commentsService.preview(dto);
  }

  @Get()
  findAll(@Query() query: CommentQueryDto): Promise<PaginatedCommentsResponse> {
    return this.commentsService.findAll(query);
  }

  @Post(':id/replies')
  createReply(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.commentsService.createReply(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CommentResponse> {
    return this.commentsService.findOne(id);
  }
}
