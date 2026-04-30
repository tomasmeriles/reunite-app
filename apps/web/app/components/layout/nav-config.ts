import type { ElementType } from 'react';
import { CalendarDays, Home, ScrollText, Users } from 'lucide-react';
import type { Action, Subject } from '~/lib/types';

export interface NavItem {
  title: string;
  label: string;
  href: string;
  icon: ElementType;
  ability?: { action: Action; subject: Subject };
  exact?: boolean;
}

export const mainNavItems: NavItem[] = [
  { title: 'Dashboard', label: 'Home', href: '/dashboard', icon: Home, exact: true },
  { title: 'Events', label: 'Events', href: '/events', icon: CalendarDays },
];

export const adminNavItems: NavItem[] = [
  {
    title: 'Users',
    label: 'Users',
    href: '/users',
    icon: Users,
    ability: { action: 'manage', subject: 'User' },
  },
  {
    title: 'Audit Logs',
    label: 'Audit',
    href: '/audit/logs',
    icon: ScrollText,
    ability: { action: 'read', subject: 'AuditLog' },
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/events') {
    return (
      pathname === '/events' ||
      (pathname.startsWith('/events/') && pathname !== '/events/create')
    );
  }
  if (item.exact) return pathname === item.href;
  return pathname.startsWith(item.href);
}
