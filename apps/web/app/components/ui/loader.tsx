import { cn } from '~/lib/utils';
import { Spinner, type SpinnerProps } from './spinner';
import env from '~/env';

// ─── Party dots ───────────────────────────────────────────────────────────────

const PARTY_DOTS = [
  { color: 'oklch(0.61 0.23 5)', delay: '0ms' }, // pink
  { color: 'oklch(0.88 0.14 84)', delay: '130ms' }, // yellow
  { color: 'oklch(0.78 0.18 165)', delay: '260ms' }, // mint
  { color: 'oklch(0.55 0.11 222)', delay: '390ms' }, // blue
];

interface LoaderProps extends SpinnerProps {
  /** Ocupa toda la pantalla y centra el spinner */
  fullScreen?: boolean;
  /** Ocupa el contenedor padre y centra el spinner */
  fullContainer?: boolean;
  label?: string;
}

export function Loader({
  fullScreen = false,
  fullContainer = false,
  label,
  size,
  className,
  ...props
}: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background">
        <div className="flex items-end gap-2.5">
          {PARTY_DOTS.map(({ color, delay }) => (
            <div
              key={delay}
              className="h-3.5 w-3.5 animate-bounce rounded-full"
              style={{ background: color, animationDelay: delay }}
            />
          ))}
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {env.VITE_APP_NAME}
        </p>
      </div>
    );
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Spinner size={size} {...props} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullContainer) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center',
          className,
        )}
      >
        {spinner}
      </div>
    );
  }

  return <Spinner size={size} className={className} {...props} />;
}
