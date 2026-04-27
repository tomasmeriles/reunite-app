import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

const inputBaseClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:outline-offset-2 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40';

function Input({ className, type, ref, ...props }: React.ComponentProps<'input'>) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  const resolvedRef = (ref as React.RefObject<HTMLInputElement>) ?? innerRef;

  if (type === 'number') {
    const step = (direction: 'up' | 'down') => {
      const el = resolvedRef.current;
      if (!el) return;
      direction === 'up' ? el.stepUp() : el.stepDown();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    return (
      <div className="relative flex w-full items-center">
        <input
          ref={resolvedRef}
          type="number"
          data-slot="input"
          className={cn(
            inputBaseClass,
            'pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            className,
          )}
          {...props}
        />
        <div className="absolute right-0 flex h-full flex-col border-l border-input">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => step('up')}
            disabled={props.disabled}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-tr-lg px-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => step('down')}
            disabled={props.disabled}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-br-lg border-t border-input px-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(inputBaseClass, className)}
      {...props}
    />
  );
}

export { Input };
