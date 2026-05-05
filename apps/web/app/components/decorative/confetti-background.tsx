import { useEffect, useRef } from 'react';

const COLORS = [
  'oklch(0.61 0.23 5)',
  'oklch(0.78 0.18 165)',
  'oklch(0.88 0.14 84)',
  'oklch(0.55 0.11 222)',
];

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedY: number;
  speedX: number;
  opacity: number;
}

function createPiece(canvasWidth: number, canvasHeight: number): Piece {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight - canvasHeight,
    w: Math.random() * 6 + 4,
    h: Math.random() * 3 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    speedY: Math.random() * 0.6 + 0.3,
    speedX: (Math.random() - 0.5) * 0.4,
    opacity: Math.random() * 0.25 + 0.3,
  };
}

function createPieceAnywhere(canvasWidth: number, canvasHeight: number): Piece {
  return {
    ...createPiece(canvasWidth, canvasHeight),
    y: Math.random() * canvasHeight,
  };
}

interface ConfettiBackgroundProps {
  count?: number;
}

export function ConfettiBackground({ count = 200 }: ConfettiBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<Piece[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    piecesRef.current = Array.from({ length: count }, () =>
      createPieceAnywhere(canvas.width, canvas.height),
    );

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of piecesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 10) {
          Object.assign(p, createPiece(canvas.width, canvas.height), {
            y: -10,
          });
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
