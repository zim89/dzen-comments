import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CaptchaModule } from '../captcha/captcha.module';
import { FilesModule } from '../files/files.module';
import { COMMENTS_WS_QUEUE } from './comments-ws.constants';
import { CommentsWsProcessor } from './comments-ws.processor';
import { CommentsController } from './comments.controller';
import { CommentsGateway } from './comments.gateway';
import { CommentsService } from './comments.service';
import { HtmlSanitizerService } from './html-sanitizer.service';
import { CommentCreatedListener } from './listeners/comment-created.listener';
import { CommentCreatedWsListener } from './listeners/comment-created-ws.listener';

@Module({
  imports: [
    CaptchaModule,
    FilesModule,
    BullModule.registerQueue({ name: COMMENTS_WS_QUEUE }),
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsGateway,
    CommentsWsProcessor,
    CommentCreatedListener,
    CommentCreatedWsListener,
    HtmlSanitizerService,
  ],
})
export class CommentsModule {}
