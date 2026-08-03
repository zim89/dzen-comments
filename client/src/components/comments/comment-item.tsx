import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquareReply,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteComment } from '@/api/comments';
import { AttachmentView } from '@/components/comments/attachment-view';
import { CommentForm } from '@/components/comments/comment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { invalidateComments } from '@/hooks/use-comments';
import { useAuth } from '@/providers/auth-provider';
import type { Comment } from '@/types/api';
import { ApiError } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';

type CommentItemProps = {
  comment: Comment;
  depth?: number;
};

export function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Authentication required');
      return deleteComment(comment.id, token);
    },
    onSuccess: () => {
      toast.success('Comment deleted');
      void invalidateComments(queryClient);
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Delete failed'
      );
    },
  });

  return (
    <div
      className={cn('space-y-3', depth > 0 && 'border-l border-border pl-4')}
    >
      <Card>
        <CardContent className='space-y-3 p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='font-semibold'>{comment.userName}</span>
                <span className='text-sm text-muted-foreground'>
                  {comment.email}
                </span>
                {comment.homePage && (
                  <a
                    href={comment.homePage}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='text-sm text-primary underline-offset-4 hover:underline'
                  >
                    {comment.homePage}
                  </a>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>
                {formatDate(comment.createdAt)}
              </p>
            </div>

            {isAuthenticated && (
              <Button
                variant='ghost'
                size='sm'
                className='text-destructive hover:text-destructive'
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <Trash2 />
                )}
                Delete
              </Button>
            )}
          </div>

          <div
            className='prose prose-sm max-w-none dark:prose-invert [&_a]:text-primary [&_code]:rounded [&_code]:bg-muted [&_code]:px-1'
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />

          {comment.attachment && (
            <AttachmentView attachment={comment.attachment} />
          )}

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setReplyOpen((open) => !open)}
            >
              {replyOpen ? <ChevronUp /> : <ChevronDown />}
              <MessageSquareReply />
              Reply
            </Button>
          </div>

          {replyOpen && (
            <div className='rounded-lg border bg-muted/20 p-4'>
              <CommentForm parentId={comment.id} compact />
            </div>
          )}
        </CardContent>
      </Card>

      {comment.replies.length > 0 && (
        <div className='space-y-3'>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
