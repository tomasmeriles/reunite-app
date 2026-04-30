import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';
import { ThemeProvider } from '~/contexts/theme';
import { AuthProvider, useAuth } from '~/contexts/auth';
import { AuthModalProvider } from '~/contexts/auth-modal';
import { ConfettiProvider } from '~/contexts/confetti';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { router } from '~/router';
import './app.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
});

function InnerApp() {
  const auth = useAuth();
  return (
    <NuqsAdapter>
      <RouterProvider router={router} context={{ auth, queryClient }} />
    </NuqsAdapter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <ConfettiProvider>
                <AuthModalProvider>
                  <InnerApp />
                  <Toaster richColors position="top-right" />
                </AuthModalProvider>
              </ConfettiProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
