import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  COMMENT_CREATED_EVENT,
  CommentCreatedEvent,
} from '../events/comment-created.event';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);

  @OnEvent(COMMENT_CREATED_EVENT)
  handleCommentCreated(event: CommentCreatedEvent): void {
    this.logger.log(`Comment created: ${event.commentId}`);
  }
}
