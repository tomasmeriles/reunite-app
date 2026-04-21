import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { CalendarDays, Home, Plus, ScrollText, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/contexts/auth';
import type { Action, Subject } from '~/lib/types';
import env from '~/env';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  ability?: { action: Action; subject: Subject };
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  { title: 'Events', href: '/events', icon: CalendarDays },
];

const adminNavItems: NavItem[] = [
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    ability: { action: 'manage', subject: 'User' },
  },
  {
    title: 'Audit Logs',
    href: '/audit/logs',
    icon: ScrollText,
    ability: { action: 'read', subject: 'AuditLog' },
  },
];

function getInitials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { ability, user } = useAuth();

  const visibleAdminItems = adminNavItems.filter((item) =>
    item.ability
      ? ability.can(item.ability.action, item.ability.subject)
      : true,
  );

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl leading-none">🎉</span>
          <span className="font-bold text-lg tracking-tight">
            {env.VITE_APP_NAME}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <div className="px-2 mb-3">
          <Button
            className="w-full gap-2"
            onClick={() => void navigate({ to: '/events/create' })}
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === '/events'
                        ? pathname === '/events' ||
                          (pathname.startsWith('/events') &&
                            !pathname.startsWith('/events/create'))
                        : pathname === item.href
                    }
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.name ?? user.email}
              />
              <AvatarFallback className="text-xs">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name ?? 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
