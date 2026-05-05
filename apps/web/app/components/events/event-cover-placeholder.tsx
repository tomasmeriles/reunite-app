import {
  CalendarHeart,
  Clapperboard,
  Gem,
  Globe,
  Music2,
  PartyPopper,
  Sparkles,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

// ── Theme palette ──────────────────────────────────────────────────────────────

interface PlaceholderTheme {
  from: string;
  via: string;
  to: string;
  Icon: LucideIcon;
}

const THEMES: PlaceholderTheme[] = [
  { from: 'from-primary/20', via: 'via-secondary/10', to: 'to-background', Icon: PartyPopper },
  { from: 'from-secondary/20', via: 'via-primary/10', to: 'to-background', Icon: CalendarHeart },
  { from: 'from-primary/15', via: 'via-accent/15', to: 'to-secondary/5', Icon: Sparkles },
  { from: 'from-secondary/25', via: 'via-accent/10', to: 'to-background', Icon: Globe },
  { from: 'from-primary/10', via: 'via-secondary/20', to: 'to-accent/5', Icon: Star },
  { from: 'from-accent/20', via: 'via-primary/10', to: 'to-secondary/5', Icon: Music2 },
  { from: 'from-secondary/15', via: 'via-primary/15', to: 'to-background', Icon: Clapperboard },
  { from: 'from-primary/25', via: 'via-accent/10', to: 'to-background', Icon: Gem },
];

function hashTitle(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = Math.imul(31, h) + title.charCodeAt(i);
  }
  return Math.abs(h);
}

// ── Component ──────────────────────────────────────────────────────────────────

export interface EventCoverPlaceholderProps {
  /** Used to derive a consistent theme. Falls back to a default theme if absent. */
  title?: string;
  className?: string;
  /** Controls emoji size. Defaults to "lg". */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ICON_SIZE: Record<NonNullable<EventCoverPlaceholderProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 72,
};

export function EventCoverPlaceholder({
  title,
  className,
  size = 'lg',
}: EventCoverPlaceholderProps) {
  const theme = THEMES[(title ? hashTitle(title) : 0) % THEMES.length]!;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        `bg-linear-to-br ${theme.from} ${theme.via} ${theme.to}`,
        className,
      )}
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Soft blob shapes */}
      <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-secondary/10 blur-3xl" />
      {/* Icon */}
      <theme.Icon
        size={ICON_SIZE[size]}
        className="relative opacity-40"
        aria-hidden
      />
    </div>
  );
}
