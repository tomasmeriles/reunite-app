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
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { SectionHeader } from '~/components/ui/section-header';
import { IconCard } from '~/components/ui/icon-card';
import { StepList, StepItem } from '~/components/ui/step-list';
import { DotGrid } from '~/components/decorative/dot-grid';
import { ConfettiBackground } from '~/components/decorative/confetti-background';
import { GradientBanner } from '~/components/marketing/gradient-banner';
import { ThemeToggle } from '~/components/theme-toggle';
import { LanguageSwitcher } from '~/components/layout/language-switcher';
import { useAuth } from '~/contexts/auth';
import { useAuthModal } from '~/contexts/auth-modal';
import env from '~/env';

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { t } = useTranslation('landing');
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
        <LanguageSwitcher />
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:block">
              {t('nav.greeting', { name: user?.name?.split(' ')[0] })}
            </span>
            <Button size="sm" onClick={() => navigate({ to: '/dashboard' })}>
              {t('nav.dashboard')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuthModal('login')}
            >
              {t('nav.signIn')}
            </Button>
            <Button size="sm" onClick={() => openAuthModal('register')}>
              {t('nav.getStarted')}
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { t } = useTranslation('landing');
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
      <ConfettiBackground />

      <div className="pointer-events-none absolute inset-0 text-foreground">
        <DotGrid />
      </div>

      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          <PartyPopper className="h-3.5 w-3.5 text-primary" />
          {t('hero.badge')}
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {t('hero.headline1')}{' '}
          <span className="bg-linear-to-r from-primary via-[oklch(0.88_0.14_84)] to-[oklch(0.78_0.18_165)] bg-clip-text text-transparent">
            {t('hero.headline2')}
          </span>
          <br />
          {t('hero.headline3')}
        </h1>

        <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t('hero.description')}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            variant="party"
            className="gap-2 px-8 text-base"
            onClick={handleCreateEvent}
          >
            {t('hero.cta')}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {!isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-8 text-base backdrop-blur-sm"
              onClick={() => openAuthModal('login')}
            >
              {t('hero.signIn')}
            </Button>
          )}
          {isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-8 text-base"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              {t('hero.goToDashboard')}
            </Button>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <div className="h-8 w-5 rounded-full border-2 border-foreground/40 p-1">
          <div className="mx-auto h-1.5 w-1 rounded-full bg-foreground/60" />
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const { t } = useTranslation('landing');

  const FEATURES = [
    { icon: Users, key: 'attendees', color: 'text-primary bg-primary/10' },
    { icon: MessageSquare, key: 'chat', color: 'text-[oklch(0.55_0.11_222)] bg-[oklch(0.55_0.11_222)]/10' },
    { icon: ImageIcon, key: 'photos', color: 'text-[oklch(0.78_0.18_165)] bg-[oklch(0.78_0.18_165)]/10' },
    { icon: Trophy, key: 'prizes', color: 'text-[oklch(0.88_0.14_84)] bg-[oklch(0.88_0.14_84)]/10' },
    { icon: Lock, key: 'access', color: 'text-primary bg-primary/10' },
    { icon: BarChart3, key: 'analytics', color: 'text-[oklch(0.55_0.11_222)] bg-[oklch(0.55_0.11_222)]/10' },
  ] as const;

  return (
    <section className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          title={t('features.title')}
          description={t('features.description')}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, key, color }) => (
            <IconCard
              key={key}
              icon={icon}
              title={t(`features.items.${key}.title`)}
              description={t(`features.items.${key}.description`)}
              colorClass={color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const { t } = useTranslation('landing');

  const STEPS = [
    { icon: CalendarDays, key: 'create' },
    { icon: Share2, key: 'share' },
    { icon: Sparkles, key: 'enjoy' },
  ] as const;

  return (
    <section className="relative overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-secondary/10 to-transparent" />

      <div className="relative mx-auto max-w-4xl">
        <SectionHeader
          title={t('howItWorks.title')}
          description={t('howItWorks.description')}
        />

        <StepList>
          {STEPS.map(({ icon, key }, i) => (
            <StepItem
              key={key}
              icon={icon}
              title={t(`howItWorks.steps.${key}.title`)}
              description={t(`howItWorks.steps.${key}.description`)}
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
  const { t } = useTranslation('landing');
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
        title={t('cta.title')}
        description={t('cta.description')}
        icon={Sparkles}
      >
        <Button
          size="lg"
          variant="party"
          className="gap-2 px-10 text-base font-semibold"
          onClick={handleCta}
        >
          {isAuthenticated ? t('cta.createEvent') : t('cta.startFree')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </GradientBanner>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useTranslation('landing');

  return (
    <footer className="border-t border-border/40 px-6 py-8 text-center text-sm text-muted-foreground">
      <p>
        &copy; {new Date().getFullYear()}{' '}
        <span className="font-medium text-foreground">
          {env.VITE_APP_NAME ?? 'Reunite'}
        </span>
        . {t('footer.rights')}
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
