import { useState } from 'react';
import { CommentsPanel } from '@/components/comments/comments-panel';
import { NewCommentSheet } from '@/components/comments/new-comment-sheet';
import { AppHeader } from '@/components/layout/app-header';
import { useCommentsSocket } from '@/hooks/use-comments';
import type { CommentSortField, CommentSortOrder } from '@/types/api';

export function App() {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<CommentSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('desc');

  useCommentsSocket();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex justify-end">
          <NewCommentSheet />
        </div>
        <CommentsPanel
          page={page}
          sortField={sortField}
          sortOrder={sortOrder}
          onPageChange={setPage}
          onSortFieldChange={(field) => {
            setSortField(field);
            setPage(1);
          }}
          onSortOrderChange={(order) => {
            setSortOrder(order);
            setPage(1);
          }}
        />
      </main>
    </div>
  );
}
