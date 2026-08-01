export const COMMENT_CREATED_EVENT = 'comment.created';

export class CommentCreatedEvent {
  constructor(public readonly commentId: string) {}
}
