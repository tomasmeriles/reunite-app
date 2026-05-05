import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

interface GradientBannerProps {
  title: string;
  description?: string;
  /** Icon shown above the title */
  icon?: LucideIcon;
  /** CTA button(s) or any content below the description */
  children?: React.ReactNode;
  className?: string;
}

export function GradientBanner({
  title,
  description,
  icon: Icon,
  children,
  className,
}: GradientBannerProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-2xl overflow-hidden rounded-3xl bg-linear-to-br from-primary via-[oklch(0.65_0.20_20)] to-[oklch(0.78_0.18_165)] p-px shadow-2xl',
        className,
      )}
    >
      <div className="rounded-[calc(1.5rem-1px)] bg-linear-to-br from-primary/90 via-[oklch(0.65_0.20_20)/90] to-[oklch(0.78_0.18_165)/90] p-10 text-center text-primary-foreground backdrop-blur-sm">
        {Icon && (
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-white/20 p-3">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <h2 className="mb-3 text-3xl font-bold sm:text-4xl">{title}</h2>
        {description && (
          <p className="mb-8 text-primary-foreground/80">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
