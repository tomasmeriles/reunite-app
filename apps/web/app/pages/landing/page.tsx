import { useNavigate } from '@tanstack/react-router';
import {
  CalendarDays,
  MessageSquare,
  ImageIcon,
  Trophy,
  Lock,
  BarChart3,
  ArrowRight,
  Sparkles,
  Users,
  Share2,
  PartyPopper,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { SectionHeader } from '~/components/ui/section-header';
import { IconCard } from '~/components/ui/icon-card';
import { StepList, StepItem } from '~/components/ui/step-list';
import { DotGrid } from '~/components/decorative/dot-grid';
import { ConfettiBackground } from '~/components/decorative/confetti-background';
import { GradientBanner } from '~/components/marketing/gradient-banner';
import { ThemeToggle } from '~/components/theme-toggle';
import { useAuth } from '~/contexts/auth';
import { useAuthModal } from '~/contexts/auth-modal';
import env from '~/env';

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-tight">
          {env.VITE_APP_NAME}
        </span>
      </div>

      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:block">
              Hey, {user?.name?.split(' ')[0]}
            </span>
            <Button size="sm" onClick={() => navigate({ to: '/dashboard' })}>
              Dashboard
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuthModal('login')}
            >
              Sign in
            </Button>
            <Button size="sm" onClick={() => openAuthModal('register')}>
              Get started
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    if (isAuthenticated) {
      navigate({ to: '/events/create' });
    } else {
      openAuthModal('register');
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Background blobs */}
      {/* <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-125 w-125 animate-blob-1 rounded-full opacity-30 blur-3xl"
          style={{ background: 'oklch(0.61 0.23 5)' }}
        />
        <div
          className="absolute -bottom-48 left-1/3 h-150 w-150 animate-blob-2 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'oklch(0.78 0.18 165)',
            animationDelay: '4s',
          }}
        />
        <div
          className="absolute -right-32 top-1/4 h-112.5 w-112.5 animate-blob-3 rounded-full opacity-25 blur-3xl"
          style={{
            background: 'oklch(0.88 0.14 84)',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-75 w-75 animate-blob-4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-2xl"
          style={{
            background: 'oklch(0.55 0.11 222)',
            animationDelay: '6s',
          }}
        />
      </div> */}

      {/* Confetti */}
      <ConfettiBackground />

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 text-foreground">
        <DotGrid />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          <PartyPopper className="h-3.5 w-3.5 text-primary" />
          Turn plans into memories
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Create{' '}
          <span className="bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-[oklch(0.78_0.18_165)] bg-clip-text text-transparent">
            moments.
          </span>
          <br />
          Connect people.
        </h1>

        <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
          Plan your event, invite your guests, manage attendance, share photos
          and celebrate together — all in one place.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            variant="party"
            className="gap-2 px-8 text-base"
            onClick={handleCreateEvent}
          >
            Create my first event
            <ArrowRight className="h-4 w-4" />
          </Button>
          {!isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-8 text-base backdrop-blur-sm"
              onClick={() => openAuthModal('login')}
            >
              Sign in
            </Button>
          )}
          {isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-8 text-base"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              Go to dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <div className="h-8 w-5 rounded-full border-2 border-foreground/40 p-1">
          <div className="mx-auto h-1.5 w-1 rounded-full bg-foreground/60" />
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    title: 'Attendee management',
    description:
      'Track RSVPs, manage waitlists, and control capacity with ease.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: MessageSquare,
    title: 'Real-time chat',
    description: 'Let your guests connect before, during and after the event.',
    color: 'text-[oklch(0.55_0.11_222)] bg-[oklch(0.55_0.11_222)]/10',
  },
  {
    icon: ImageIcon,
    title: 'Photo gallery',
    description:
      'Collect and share memories. Guests can upload directly from their phones.',
    color: 'text-[oklch(0.78_0.18_165)] bg-[oklch(0.78_0.18_165)]/10',
  },
  {
    icon: Trophy,
    title: 'Prizes & giveaways',
    description:
      'Run draws and award prizes to keep the energy high all night.',
    color: 'text-[oklch(0.88_0.14_84)] bg-[oklch(0.88_0.14_84)]/10',
  },
  {
    icon: Lock,
    title: 'Flexible access control',
    description:
      'Public events, private invite-only, or link-based access — your choice.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Insights & analytics',
    description:
      'See who attended, engagement stats, and post-event summaries.',
    color: 'text-[oklch(0.55_0.11_222)] bg-[oklch(0.55_0.11_222)]/10',
  },
] as const;

function FeaturesSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          title="Everything you need to run a great event"
          description="From planning to celebration — one platform, zero hassle."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, description, color }) => (
            <IconCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              colorClass={color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Create your event',
    description:
      'Fill in the details — title, date, location, cover image, access rules. Takes less than 2 minutes.',
  },
  {
    number: '02',
    icon: Share2,
    title: 'Share the link',
    description:
      'Send your unique event link. Guests can RSVP, join the chat and see the schedule instantly.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Enjoy together',
    description:
      'During and after the event, everyone shares photos, wins prizes and keeps the vibe going.',
  },
] as const;

function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* Subtle background tint */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-secondary/10 to-transparent" />

      <div className="relative mx-auto max-w-4xl">
        <SectionHeader
          title="How it works"
          description="Three simple steps to your perfect event."
        />

        <StepList>
          {STEPS.map(({ icon, title, description }, i) => (
            <StepItem
              key={title}
              icon={icon}
              title={title}
              description={description}
              step={i + 1}
              showConnector={i < STEPS.length - 1}
            />
          ))}
        </StepList>
      </div>
    </section>
  );
}

// ─── CTA final ────────────────────────────────────────────────────────────────

function CtaSection() {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const handleCta = () => {
    if (isAuthenticated) {
      navigate({ to: '/events/create' });
    } else {
      openAuthModal('register');
    }
  };

  return (
    <section className="px-6 py-24">
      <GradientBanner
        title="Ready to create something special?"
        description="Join thousands of event creators. Free to start, no credit card required."
        icon={Sparkles}
      >
        <Button
          size="lg"
          variant="party"
          className="gap-2 px-10 text-base font-semibold"
          onClick={handleCta}
        >
          {isAuthenticated ? 'Create an event' : 'Start for free'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </GradientBanner>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-8 text-center text-sm text-muted-foreground">
      <p>
        &copy; {new Date().getFullYear()}{' '}
        <span className="font-medium text-foreground">
          {env.VITE_APP_NAME ?? 'Reunite'}
        </span>
        . All rights reserved.
      </p>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
