'use client';

import { useEffect, useRef } from 'react';

/**
 * Confettis canvas auto-suffisants (sans dépendance externe). Tombent 4 s puis s'arrêtent.
 * Respecte prefers-reduced-motion.
 */
export default function Confetti({ duration = 4000 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#7C3AED', '#A855F7', '#db2777', '#22c55e', '#f59e0b', '#ffffff'];
    const N = 160;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 4,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = elapsed > duration - 800 ? Math.max(0, (duration - elapsed) / 800) : 1;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [duration]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[120]" />;
}
