import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepDef {
  title: string;
  description?: string;
  icon: LucideIcon;
}

export interface StepperProps {
  steps: StepDef[];
  /** 0-based index of the currently active step */
  currentStep: number;
  /** Called when the user clicks a completed step to jump back */
  onStepClick: (index: number) => void;
  /** Each child at index i is rendered when step i is active */
  children: React.ReactNode[];
  /** Optional summary node shown below the title when the step is completed */
  summaries?: React.ReactNode[];
  /** Render steps in a vertical layout (default: false — horizontal) */
  vertical?: boolean;
  className?: string;
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  children,
  summaries,
  vertical = false,
  className,
}: StepperProps) {
  if (vertical) {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = isCompleted;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex gap-4">
              {/* ── Left column: circle + connector ── */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  aria-label={`${isCompleted ? 'Go back to' : ''} step ${index + 1}: ${step.title}`}
                  className={cn(
                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    // Pending
                    !isActive &&
                      !isCompleted &&
                      'bg-muted text-muted-foreground ring-2 ring-border',
                    // Active
                    isActive &&
                      'bg-linear-to-br from-primary to-[oklch(0.78_0.18_165)] text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
                    // Completed
                    isCompleted &&
                      'bg-linear-to-br from-primary to-[oklch(0.78_0.18_165)] text-primary-foreground shadow-md shadow-primary/20',
                    isClickable &&
                      'cursor-pointer hover:shadow-lg hover:shadow-primary/30 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background',
                    !isClickable && !isActive && 'cursor-default',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <step.icon
                      className={cn(
                        'h-4 w-4',
                        !isActive && !isCompleted && 'opacity-50',
                      )}
                    />
                  )}

                  {/* Step number badge — only on active */}
                  {isActive && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground ring-1 ring-border">
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'mt-1 w-px flex-1 transition-colors duration-500',
                      isCompleted ? 'bg-primary/40' : 'bg-border/60',
                    )}
                    style={{ minHeight: '1.5rem' }}
                  />
                )}
              </div>

              {/* ── Right column: header + content ── */}
              <div className={cn('flex-1', !isLast && 'pb-2')}>
                {/* Step header */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  className={cn(
                    'mb-1 flex w-full items-center gap-2 text-left transition-colors',
                    isClickable && 'cursor-pointer group',
                    !isClickable && !isActive && 'cursor-default',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isActive && 'text-foreground',
                      isCompleted &&
                        'text-muted-foreground group-hover:text-foreground',
                      !isActive && !isCompleted && 'text-muted-foreground/60',
                    )}
                  >
                    {step.title}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-medium text-primary/70 transition-colors group-hover:text-primary">
                      Edit
                    </span>
                  )}
                  {!isActive && !isCompleted && (
                    <span className="text-[10px] text-muted-foreground/50">
                      Step {index + 1}
                    </span>
                  )}
                </button>

                {/* Summary (completed) or description (pending) */}
                {isCompleted && summaries?.[index] ? (
                  <div className="mb-2">{summaries[index]}</div>
                ) : (
                  step.description &&
                  !isActive && (
                    <p className="mb-2 text-xs text-muted-foreground/60">
                      {step.description}
                    </p>
                  )
                )}

                {/* Step content — animated expand/collapse */}
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isActive
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="-mx-1 overflow-hidden px-1">
                    <div className={cn('pt-3 pb-6', isLast && 'pb-2')}>
                      {children[index]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Horizontal layout ──────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Step indicators */}
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = isCompleted;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex flex-1 items-start last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  aria-label={`${isCompleted ? 'Go back to' : ''} step ${index + 1}: ${step.title}`}
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    !isActive &&
                      !isCompleted &&
                      'bg-muted text-muted-foreground ring-2 ring-border',
                    isActive &&
                      'bg-linear-to-br from-primary to-[oklch(0.78_0.18_165)] text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
                    isCompleted &&
                      'bg-linear-to-br from-primary to-[oklch(0.78_0.18_165)] text-primary-foreground shadow-md shadow-primary/20',
                    isClickable &&
                      'cursor-pointer hover:shadow-lg hover:shadow-primary/30 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background',
                    !isClickable && !isActive && 'cursor-default',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <step.icon
                      className={cn(
                        'h-4 w-4',
                        !isActive && !isCompleted && 'opacity-50',
                      )}
                    />
                  )}
                  {isActive && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground ring-1 ring-border">
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={cn(
                    'max-w-24 text-center text-xs font-semibold transition-colors',
                    isActive && 'text-foreground',
                    isCompleted && 'text-muted-foreground',
                    !isActive && !isCompleted && 'text-muted-foreground/50',
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Horizontal connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'mx-2 mt-5 h-px flex-1 transition-colors duration-500',
                    isCompleted ? 'bg-primary/40' : 'bg-border/60',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step content */}
      <div>{children[currentStep]}</div>
    </div>
  );
}
