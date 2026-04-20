import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

interface IconCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Tailwind classes for icon color + background, e.g. "text-primary bg-primary/10" */
  colorClass?: string;
  className?: string;
}

export function IconCard({
  icon: Icon,
  title,
  description,
  colorClass = 'text-primary bg-primary/10',
  className,
}: IconCardProps) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
        className,
      )}
    >
      <div className={cn('mb-4 inline-flex rounded-xl p-3', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
