import { cn } from '~/lib/utils';

interface DotGridProps {
  /** Opacity as a decimal (e.g. 0.15 renders as opacity-[0.15]) */
  opacity?: number;
  /** Radius of each dot in SVG units */
  dotSize?: number;
  /** Size of the repeating tile in SVG units */
  spacing?: number;
  className?: string;
}

export function DotGrid({
  opacity = 0.15,
  dotSize = 1.5,
  spacing = 24,
  className,
}: DotGridProps) {
  return (
    <svg
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        className,
      )}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dots"
          x="0"
          y="0"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r={dotSize} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}
