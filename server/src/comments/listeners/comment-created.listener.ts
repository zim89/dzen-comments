import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '../../cache/cache.service';
import {
  COMMENT_CREATED_EVENT,
  CommentCreatedEvent,
} from '../events/comment-created.event';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);

  constructor(private readonly cacheService: CacheService) {}

  @OnEvent(COMMENT_CREATED_EVENT)
  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    await this.cacheService.invalidate('comments:list:*');
    this.logger.log(`Comment created: ${event.commentId}`);
  }
}
