import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  COMMENTS_WS_QUEUE,
  WS_BROADCAST_JOB,
  type WsBroadcastJobData,
} from './comments-ws.constants';
import { CommentsGateway } from './comments.gateway';
import { CommentsService } from './comments.service';

@Processor(COMMENTS_WS_QUEUE)
export class CommentsWsProcessor extends WorkerHost {
  private readonly logger = new Logger(CommentsWsProcessor.name);

  constructor(
    private readonly commentsGateway: CommentsGateway,
    private readonly commentsService: CommentsService,
  ) {
    super();
  }

  async process(job: Job<WsBroadcastJobData>): Promise<void> {
    if (job.name !== WS_BROADCAST_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const comment = await this.commentsService.findByIdForBroadcast(
      job.data.commentId,
    );

    if (comment.parentId === null) {
      this.commentsGateway.broadcastCommentCreated(comment);
      this.logger.log(`Broadcast comment:created ${comment.id}`);
      return;
    }

    this.commentsGateway.broadcastCommentReply(comment);
    this.logger.log(`Broadcast comment:reply ${comment.id}`);
  }
}
