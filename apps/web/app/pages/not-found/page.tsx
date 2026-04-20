import { Link } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';
import { DotGrid } from '~/components/decorative/dot-grid';
import { ThemeToggle } from '~/components/theme-toggle';
import { Button } from '~/components/ui/button';
import env from '~/env';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20">
      {/* Background layer blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-96 w-96 animate-blob-1 rounded-full opacity-30 blur-3xl"
          style={{ background: 'oklch(0.61 0.23 5)' }}
        />
        <div
          className="absolute -bottom-40 right-1/4 h-112 w-md animate-blob-2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'oklch(0.78 0.18 165)', animationDelay: '4s' }}
        />
        <div
          className="absolute -right-24 top-1/3 h-80 w-80 animate-blob-3 rounded-full opacity-20 blur-3xl"
          style={{ background: 'oklch(0.88 0.14 84)', animationDelay: '2s' }}
        />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 text-foreground">
        <DotGrid opacity={0.08} />
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">
            {env.VITE_APP_NAME}
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="rounded-2xl border border-border/60 bg-card/70 px-8 py-12 shadow-xl backdrop-blur-sm">
          <h1 className="mb-3 bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-8xl font-bold text-transparent">
            404
          </h1>
          <p className="mb-2 text-xl font-semibold">Page not found</p>
          <p className="mb-8 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
