import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CommentResponse } from './comments.types';
import {
  WS_EVENT_COMMENT_CREATED,
  WS_EVENT_COMMENT_REPLY,
} from './comments-ws.constants';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CommentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CommentsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(): void {
    this.logger.log('WebSocket client connected');
  }

  handleDisconnect(): void {
    this.logger.log('WebSocket client disconnected');
  }

  broadcastCommentCreated(comment: CommentResponse): void {
    this.server.emit(WS_EVENT_COMMENT_CREATED, comment);
  }

  broadcastCommentReply(comment: CommentResponse): void {
    this.server.emit(WS_EVENT_COMMENT_REPLY, comment);
  }
}
