import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { NavRail } from '~/components/layout/nav-rail';
import { BottomNav } from '~/components/layout/bottom-nav';
import { useAuth } from '~/contexts/auth';
import { useNotificationSocket } from '~/hooks/use-websocket';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Navigate to /login after the render where isAuthenticated becomes false.
  // We cannot rely on the mutation's onSuccess callback because React 18
  // batches the setQueryData state update, so the router context is still
  // stale when navigate() is called there — causing authLayoutRoute.beforeLoad
  // to see isAuthenticated=true and redirect back to /dashboard.
  // useEffect runs after the commit, so the context is always up-to-date here.
  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: '/login', replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Initialize WebSocket for real-time notifications
  useNotificationSocket();

  return (
    <div className="min-h-svh">
      <NavRail />
      <BottomNav />
      <main className="md:pl-20 pb-16 md:pb-0 flex flex-1 flex-col gap-4 p-6">
        <Outlet />
      </main>
    </div>
  );
}
