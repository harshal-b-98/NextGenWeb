import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-[var(--color-input)] text-[var(--color-foreground)] px-3 py-2 text-sm transition-colors',
          'placeholder:text-[var(--color-muted-foreground)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'border-[var(--color-border)]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
