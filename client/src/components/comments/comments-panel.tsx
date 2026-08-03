import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { CommentItem } from '@/components/comments/comment-item';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCommentsQuery } from '@/hooks/use-comments';
import type { CommentSortField, CommentSortOrder } from '@/types/api';
import { cn } from '@/lib/utils';

type CommentsPanelProps = {
  page: number;
  sortField: CommentSortField;
  sortOrder: CommentSortOrder;
  onPageChange: (page: number) => void;
  onSortFieldChange: (field: CommentSortField) => void;
  onSortOrderChange: (order: CommentSortOrder) => void;
};

const LIMIT = 25;

export function CommentsPanel({
  page,
  sortField,
  sortOrder,
  onPageChange,
  onSortFieldChange,
  onSortOrderChange,
}: CommentsPanelProps) {
  const { data, isLoading, isFetching, isError, error } = useCommentsQuery({
    page,
    limit: LIMIT,
    sortField,
    sortOrder,
  });

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" />
        Загрузка комментариев...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {(error as Error).message || 'Не удалось загрузить комментарии'}
      </div>
    );
  }

  const comments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Комментарии</h2>
            {isFetching && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {meta?.total ?? 0} записей, по {LIMIT} на страницу
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Сортировка</p>
            <Select
              value={sortField}
              onValueChange={(value) =>
                onSortFieldChange(value as CommentSortField)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Дата</SelectItem>
                <SelectItem value="userName">Имя</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Порядок</p>
            <Select
              value={sortOrder}
              onValueChange={(value) =>
                onSortOrderChange(value as CommentSortOrder)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">LIFO / Убыв.</SelectItem>
                <SelectItem value="asc">FIFO / Возр.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Пока нет комментариев. Будьте первым!
        </div>
      ) : (
        <div
          className={cn(
            'space-y-4 transition-opacity',
            isFetching && 'opacity-70',
          )}
        >
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Страница {meta.page} из {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft />
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Вперёд
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
