import { Link, useLocation } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { cn } from '~/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/layout/user-menu';
import { useAuth } from '~/contexts/auth';
import env from '~/env';
import {
  adminNavItems,
  isNavItemActive,
  mainNavItems,
  type NavItem,
} from './nav-config';

function RailItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.href}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <item.icon className="size-5" />
          <span className="sr-only">{item.title}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

export function NavRail() {
  const { pathname } = useLocation();
  const { ability } = useAuth();

  const visibleAdminItems = adminNavItems.filter((item) =>
    item.ability ? ability.can(item.ability.action, item.ability.subject) : true,
  );

  const createActive = pathname === '/events/create';

  return (
    <TooltipProvider>
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-14 flex-col border-r bg-background z-40">
        <div className="flex h-14 items-center justify-center border-b shrink-0">
          <Link to="/dashboard" aria-label={env.VITE_APP_NAME}>
            <span className="text-2xl leading-none">🎉</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 py-3 overflow-y-auto">
          {mainNavItems.map((item) => (
            <RailItem
              key={item.href}
              item={item}
              isActive={isNavItemActive(item, pathname)}
            />
          ))}

          <div className="h-px w-8 bg-border my-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/events/create"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  createActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}
                aria-current={createActive ? 'page' : undefined}
              >
                <Plus className="size-5" />
                <span className="sr-only">New Event</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">New Event</TooltipContent>
          </Tooltip>

          {visibleAdminItems.length > 0 && (
            <>
              <div className="h-px w-8 bg-border my-2" />
              {visibleAdminItems.map((item) => (
                <RailItem
                  key={item.href}
                  item={item}
                  isActive={isNavItemActive(item, pathname)}
                />
              ))}
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 py-3 border-t shrink-0">
          <ThemeToggle />
          <UserMenu />
        </div>
      </nav>
    </TooltipProvider>
  );
}
