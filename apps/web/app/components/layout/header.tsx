import { useLocation } from '@tanstack/react-router';
import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/layout/user-menu';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/events': 'My Events',
  '/events/create': 'Create Event',
  '/users': 'Users',
  '/audit/logs': 'Audit Logs',
  '/403': 'Access Denied',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/events/') && pathname.endsWith('/manage'))
    return 'Manage Event';
  if (pathname.startsWith('/users/')) return 'User Details';
  if (pathname.startsWith('/events/')) return 'Event';
  return '';
}

export function AppHeader() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      {title && (
        <>
          <Separator orientation="vertical" className="mr-1 h-4" />
          <h1 className="text-base font-semibold">{title}</h1>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
