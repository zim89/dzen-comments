import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import {
  COMMENTS_WS_QUEUE,
  WS_BROADCAST_JOB,
  type WsBroadcastJobData,
} from '../comments-ws.constants';
import {
  COMMENT_CREATED_EVENT,
  CommentCreatedEvent,
} from '../events/comment-created.event';

@Injectable()
export class CommentCreatedWsListener {
  private readonly logger = new Logger(CommentCreatedWsListener.name);

  constructor(
    @InjectQueue(COMMENTS_WS_QUEUE) private readonly commentsWsQueue: Queue,
  ) {}

  @OnEvent(COMMENT_CREATED_EVENT)
  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    await this.commentsWsQueue.add(WS_BROADCAST_JOB, {
      commentId: event.commentId,
    } satisfies WsBroadcastJobData);

    this.logger.log(`Queued ws-broadcast for comment ${event.commentId}`);
  }
}
