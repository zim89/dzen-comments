export const COMMENTS_WS_QUEUE = 'comments-ws';
export const WS_BROADCAST_JOB = 'ws-broadcast';

export const WS_EVENT_COMMENT_CREATED = 'comment:created';
export const WS_EVENT_COMMENT_REPLY = 'comment:reply';

export type WsBroadcastJobData = {
  commentId: string;
};
