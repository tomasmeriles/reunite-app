import { createContext, useCallback, useContext, useState } from 'react';
import { AuthModal, type AuthModalTab } from '~/components/auth/auth-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthModalState {
  open: boolean;
  tab: AuthModalTab;
  onSuccess?: () => void;
}

interface AuthModalContextValue {
  /**
   * Open the auth modal from anywhere in the app.
   *
   * @param tab        Which tab to show first. Defaults to 'login'.
   * @param onSuccess  Optional callback fired after a successful auth action.
   */
  openAuthModal: (tab?: AuthModalTab, onSuccess?: () => void) => void;
  closeAuthModal: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthModalState>({
    open: false,
    tab: 'login',
  });

  const openAuthModal = useCallback(
    (tab: AuthModalTab = 'login', onSuccess?: () => void) => {
      setState({ open: true, tab, onSuccess });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  }, []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal
        open={state.open}
        onOpenChange={handleOpenChange}
        defaultTab={state.tab}
        onSuccess={state.onSuccess}
      />
    </AuthModalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error('useAuthModal must be used within <AuthModalProvider>');
  return ctx;
}
