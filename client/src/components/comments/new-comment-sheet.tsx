import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CommentForm } from '@/components/comments/comment-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function NewCommentSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus />
          Новый комментарий
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Новый комментарий</SheetTitle>
          <SheetDescription>
            Заполните форму. Поддерживаются теги i, strong, code, a.
          </SheetDescription>
        </SheetHeader>
        {open && (
          <CommentForm
            compact
            onSuccess={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
