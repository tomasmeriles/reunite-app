import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useMediaQuery } from '~/hooks/use-media-query';

interface ConfettiOverlayProps {
  onComplete?: () => void;
  duration?: number;
}

export function ConfettiOverlay({
  onComplete,
  duration = 2400,
}: ConfettiOverlayProps) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [dimensions, setDimensions] = useState({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  });
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete?.();
      return;
    }

    setOpacity(1);
    const fadeTimer = setTimeout(() => setOpacity(0), Math.max(0, duration - 700));
    const doneTimer = setTimeout(() => onComplete?.(), duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      style={{
        opacity,
        transition: 'opacity 0.7s ease',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        confettiSource={{
          x: dimensions.width / 2,
          y: dimensions.height * 0.55,
          w: 0,
          h: 0,
        }}
        initialVelocityX={38}
        initialVelocityY={38}
        gravity={0.28}
        numberOfPieces={320}
        recycle={false}
        tweenDuration={50}
      />
    </div>
  );
}
