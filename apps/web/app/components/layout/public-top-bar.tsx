import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '~/components/layout/language-switcher';
import { NotificationBell } from '~/components/layout/notification-bell';
import { ThemeToggle } from '~/components/theme-toggle';
import { Button } from '~/components/ui/button';
import { useBreakpoint } from '~/hooks/use-breakpoint';

interface PublicTopBarProps {
  user: { name?: string | null } | null | undefined;
}

export function PublicTopBar({ user }: PublicTopBarProps) {
  const { t } = useTranslation('common');
  const isMobile = useBreakpoint() === 'xs';

  return (
    <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-1.5"
        >
          <span className="text-lg">🎉</span>
          {!isMobile && (
            <span className="font-semibold tracking-tight">Reunite</span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {user && <NotificationBell />}
          <Button variant="ghost" size="sm" asChild>
            <Link to={user ? '/dashboard' : '/'}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {!isMobile && (user ? t('nav.dashboard') : t('nav.events'))}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
