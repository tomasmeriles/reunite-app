import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

// ─── StepItem ─────────────────────────────────────────────────────────────────

interface StepItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** 1-based step number — shown as badge and large decorative label */
  step: number;
  /** Render the horizontal dashed connector to the right of this step */
  showConnector?: boolean;
  className?: string;
}

export function StepItem({
  icon: Icon,
  title,
  description,
  step,
  showConnector = false,
  className,
}: StepItemProps) {
  const displayNumber = String(step).padStart(2, '0');

  return (
    <div
      className={cn(
        'relative flex flex-col items-center text-center',
        className,
      )}
    >
      {/* Connector line */}
      {showConnector && (
        <div className="absolute left-[calc(50%+3rem)] top-7 hidden h-px w-[calc(100%-6rem)] border-t border-dashed border-border/60 sm:block" />
      )}

      {/* Step badge */}
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-[oklch(0.78_0.18_165)] text-primary-foreground shadow-lg">
        <Icon className="h-6 w-6" />
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-foreground ring-2 ring-background">
          {step}
        </span>
      </div>

      {/* Large decorative number */}
      <span className="mb-1 select-none text-[3rem] font-black leading-none text-border/40">
        {displayNumber}
      </span>

      <h3 className="-mt-2 mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

// ─── StepList ─────────────────────────────────────────────────────────────────

interface StepListProps {
  children: React.ReactNode;
  /** Tailwind grid-cols class for responsive columns, e.g. "sm:grid-cols-3" */
  columns?: string;
  className?: string;
}

export function StepList({
  children,
  columns = 'sm:grid-cols-3',
  className,
}: StepListProps) {
  return <div className={cn('grid gap-8', columns, className)}>{children}</div>;
}
