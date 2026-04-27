import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { lazy } from 'react';

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    );
import AuthLayout from '~/layouts/auth-layout';
import AppLayout from '~/layouts/app-layout';
const LandingPage = lazy(() => import('~/pages/landing/page'));
import LoginPage from '~/pages/auth/login/page';
import RegisterPage from '~/pages/auth/register/page';
import ForgotPasswordPage from '~/pages/auth/forgot-password/page';
import ResetPasswordPage from '~/pages/auth/reset-password/page';
import DashboardPage from '~/pages/dashboard/page';
const EventsPage = lazy(() => import('~/pages/events/page'));
import UsersPage from '~/pages/users/page';
import UserDetailPage from '~/pages/users/[id]/page';
import AuditLogsPage from '~/pages/audit/logs/page';
import ForbiddenPage from '~/pages/forbidden/page';
import NotFoundPage from '~/pages/not-found/page';
// Event pages (lazy-loaded)
const EventCreatePage = lazy(() => import('~/pages/events/create/page'));
const EventDetailPage = lazy(() => import('~/pages/events/[id]/page'));
const EventManagePage = lazy(() => import('~/pages/events/[id]/manage/page'));
const JoinPage = lazy(() => import('~/pages/join/[token]/page'));
import type { AuthContextValue } from '~/contexts/auth';

interface RouterContext {
  auth: AuthContextValue;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: NotFoundPage,
});

// ─── Index ────────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// ─── Auth layout (public) ─────────────────────────────────────────────────────

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
});

// ─── App layout (protected) ───────────────────────────────────────────────────

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events',
  component: EventsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.ability.can('read', 'User')) {
      throw redirect({ to: '/403' });
    }
  },
});

const userDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users/$id',
  component: UserDetailPage,
});

const auditLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/audit/logs',
  component: AuditLogsPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.ability.can('read', 'AuditLog')) {
      throw redirect({ to: '/403' });
    }
  },
});

const forbiddenRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/403',
  component: ForbiddenPage,
});

// ─── Event routes (protected) ─────────────────────────────────────────────────

const eventCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events/create',
  component: EventCreatePage,
});

const eventDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events/$id',
  component: EventDetailPage,
});

const eventManageRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events/$id/manage',
  component: EventManagePage,
  validateSearch: z.object({
    tab: z.string().optional(),
  }),
});

// ─── Join route (public) ──────────────────────────────────────────────────────

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join/$token',
  component: JoinPage,
});

// ─── Route tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    eventsRoute,
    usersRoute,
    userDetailRoute,
    auditLogsRoute,
    forbiddenRoute,
    eventCreateRoute,
    eventManageRoute,
  ]),
  eventDetailRoute,
  joinRoute,
]);

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
