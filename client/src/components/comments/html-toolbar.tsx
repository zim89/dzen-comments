import { Bold, Code, Italic, Link } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';

type HtmlToolbarProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  value: string;
};

type TagConfig = {
  label: string;
  open: string;
  close: string;
  icon: React.ReactNode;
};

const TAGS: TagConfig[] = [
  { label: 'i', open: '<i>', close: '</i>', icon: <Italic className="size-4" /> },
  {
    label: 'strong',
    open: '<strong>',
    close: '</strong>',
    icon: <Bold className="size-4" />,
  },
  {
    label: 'code',
    open: '<code>',
    close: '</code>',
    icon: <Code className="size-4" />,
  },
  {
    label: 'a',
    open: '<a href="https://">',
    close: '</a>',
    icon: <Link className="size-4" />,
  },
];

function insertAtSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  open: string,
  close: string,
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const wrapped = `${open}${selected}${close}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);

  requestAnimationFrame(() => {
    const cursor = start + open.length + selected.length;
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });

  return next;
}

export function HtmlToolbar({ textareaRef, onChange, value }: HtmlToolbarProps) {
  const handleTag = (tag: TagConfig) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onChange(insertAtSelection(textarea, value, tag.open, tag.close));
  };

  return (
    <div className="flex flex-wrap gap-1">
      {TAGS.map((tag) => (
        <Button
          key={tag.label}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleTag(tag)}
          title={`[${tag.label}]`}
        >
          {tag.icon}
          <span className="sr-only">{tag.label}</span>
        </Button>
      ))}
    </div>
  );
}
