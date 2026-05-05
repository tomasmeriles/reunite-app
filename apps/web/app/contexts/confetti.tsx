import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ConfettiOverlay } from '~/components/events/confetti-overlay';

const DEFAULT_CONFETTI_DURATION = 2400;

export interface LaunchConfettiOptions {
  duration?: number;
}

interface ConfettiContextValue {
  launchConfetti: (options?: LaunchConfettiOptions) => void;
  clearConfetti: () => void;
}

interface ConfettiState {
  id: number;
  duration: number;
}

const ConfettiContext = createContext<ConfettiContextValue | null>(null);

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [confetti, setConfetti] = useState<ConfettiState | null>(null);

  const clearConfetti = useCallback(() => {
    setConfetti(null);
  }, []);

  const launchConfetti = useCallback((options?: LaunchConfettiOptions) => {
    setConfetti((prev) => ({
      id: (prev?.id ?? 0) + 1,
      duration: options?.duration ?? DEFAULT_CONFETTI_DURATION,
    }));
  }, []);

  const value = useMemo(
    () => ({ launchConfetti, clearConfetti }),
    [launchConfetti, clearConfetti],
  );

  return (
    <ConfettiContext.Provider value={value}>
      {children}
      {confetti && (
        <ConfettiOverlay
          key={confetti.id}
          duration={confetti.duration}
          onComplete={() => {
            setConfetti((current) =>
              current?.id === confetti.id ? null : current,
            );
          }}
        />
      )}
    </ConfettiContext.Provider>
  );
}

export function useConfetti(): ConfettiContextValue {
  const ctx = useContext(ConfettiContext);
  if (!ctx) throw new Error('useConfetti must be used within <ConfettiProvider>');
  return ctx;
}
