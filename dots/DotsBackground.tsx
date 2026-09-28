'use client';
// Fondo de puntos para la landing de SiMAR. Copia este archivo y dots.js a components/landing/.
// El padre necesita `relative` y `overflow-clip`; el contenido que va encima, `relative`.
import { useEffect, useRef } from 'react';
import { startDots } from './dots';

type Props = {
  variant?: 'batimetria' | 'ola' | 'rejilla' | 'cifras';
  /** Color o variable CSS de los puntos, p. ej. '--simar-marea' o '--simar-curva' en bandas oscuras */
  color?: string;
  /** Color o variable CSS de los puntos cerca del cursor */
  accent?: string;
  /** Sólo para 'cifras': cuántos puntos dibujar */
  count?: number;
  interactive?: boolean;
  className?: string;
};

export default function DotsBackground({
  variant = 'batimetria',
  color = '--simar-marea',
  accent = '--simar-golfo',
  count = 600,
  interactive = true,
  className = '',
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return startDots(ref.current, { variant, color, accent, count, interactive });
  }, [variant, color, accent, count, interactive]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
