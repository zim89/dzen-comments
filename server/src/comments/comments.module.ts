import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { HtmlSanitizerService } from './html-sanitizer.service';
import { CommentCreatedListener } from './listeners/comment-created.listener';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentCreatedListener, HtmlSanitizerService],
})
export class CommentsModule {}
