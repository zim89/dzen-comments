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
          New comment
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New comment</SheetTitle>
          <SheetDescription>
            Fill out the form. Supported tags: i, strong, code, a.
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
