import type { QueryClient } from '@tanstack/react-query';
import { authApi } from '~/api/auth/auth.api';
import { authKeys } from '~/hooks/api/use-auth';
import { router } from '~/router';

/**
 * Forces a fresh /auth/me roundtrip and re-runs router guards/loaders that
 * depend on auth context so permission changes are visible before navigating.
 */
export async function syncAuthPermissions(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: authKeys.me() });
  await queryClient.fetchQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.getMe(),
    staleTime: 0,
  });
  await router.invalidate();
}
