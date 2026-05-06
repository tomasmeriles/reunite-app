import { Link, useLocation } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { cn } from '~/lib/utils';
import { UserMenu } from '~/components/layout/user-menu';
import { NotificationBell } from '~/components/layout/notification-bell';
import { useAuth } from '~/contexts/auth';
import {
  adminNavItems,
  isNavItemActive,
  mainNavItems,
  type NavItem,
} from './nav-config';

function BottomNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon className="size-5" />
      <span>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { ability } = useAuth();

  const visibleAdminItems = adminNavItems.filter((item) =>
    item.ability ? ability.can(item.ability.action, item.ability.subject) : true,
  );

  const createActive = pathname === '/events/create';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {mainNavItems.map((item) => (
        <BottomNavItem
          key={item.href}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}

      <Link
        to="/events/create"
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
          createActive ? 'text-primary' : 'text-primary/70 hover:text-primary',
        )}
        aria-current={createActive ? 'page' : undefined}
      >
        <Plus className="size-5" />
        <span>New</span>
      </Link>

      {visibleAdminItems.map((item) => (
        <BottomNavItem
          key={item.href}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}

      <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
        <NotificationBell />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
        <UserMenu />
        <span className="text-[10px] font-medium text-muted-foreground">Account</span>
      </div>
    </nav>
  );
}
