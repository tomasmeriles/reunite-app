import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader } from '~/components/ui/loader';
import { useMe } from '~/hooks/api/use-auth';
import { buildAbility, emptyAbility, type AppAbility } from '~/lib/ability';
import { hasCsrfToken } from '~/lib/axios';
import { authApi } from '~/api/auth/auth.api';
import type { SafeUser } from '~/lib/types';

export interface AuthContextValue {
  user: SafeUser | null;
  ability: AppAbility;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useMe();
  const queryClient = useQueryClient();
  const hasClaimedRef = useRef(false);

  const ability = useMemo(
    () => (data?.abilities ? buildAbility(data.abilities) : emptyAbility),
    [data?.abilities],
  );

  // On page reload and after OAuth redirects the access_token cookie is present
  // but the CSRF token is not in JS memory yet. Fetch it once from the server
  // so all subsequent state-changing requests include the x-csrf-token header.
  useEffect(() => {
    if (data?.user && !hasCsrfToken()) {
      authApi.getCsrfToken();
    }
  }, [data?.user]);

  // On first authenticated load, claim any guest attendances stored in localStorage.
  // Runs once per session; removes localStorage tokens after successful claim.
  useEffect(() => {
    if (!data?.user || hasClaimedRef.current) return;
    hasClaimedRef.current = true;

    const tokens: { token: string; eventId: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const match = /^guest_token_(.+)$/.exec(key);
      const token = match ? localStorage.getItem(key) : null;
      if (match?.[1] && token) tokens.push({ token, eventId: match[1] });
    }
    if (!tokens.length) return;

    authApi
      .claimGuestSessions(tokens.map((t) => t.token))
      .then(({ claimed }) => {
        claimed.forEach((eventId) => localStorage.removeItem(`guest_token_${eventId}`));
        void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      })
      .catch(() => {});
  }, [data?.user, queryClient]);

  if (isLoading) {
    return <Loader fullScreen size="lg" />;
  }

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        ability,
        isLoading: false,
        isAuthenticated: !!data?.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
