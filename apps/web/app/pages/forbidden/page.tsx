import { Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="rounded-2xl border border-border/60 bg-card/70 px-8 py-12 shadow-xl backdrop-blur-sm">
          <h1 className="mb-3 bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-secondary bg-clip-text text-8xl font-bold text-transparent">
            403
          </h1>
          <p className="mb-2 text-xl font-semibold">Access denied</p>
          <p className="mb-8 text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
