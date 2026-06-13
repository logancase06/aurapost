'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Grain texture subtile en overlay (style Linear.app) — SVG noise en data URI.
const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

export function GrainOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-overlay', className)}
      style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: '180px' }}
    />
  );
}

// Gradient radial derrière le hero qui suit la souris (mouse tracking).
export function MouseGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background:
          'radial-gradient(600px circle at var(--mx,50%) var(--my,30%), hsl(262 83% 58% / 0.18), transparent 60%)',
      }}
    />
  );
}

// Badge BETA animé (pulse).
export function BetaBadge() {
  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      Beta
    </span>
  );
}

// Ligne verticale animée qui défile à gauche (style technique).
export function ScanLine({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute bottom-0 left-6 top-0 hidden w-px overflow-hidden md:block', className)}>
      <div className="h-full w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
      <div className="absolute left-0 top-0 h-24 w-px animate-[meteor_4s_linear_infinite] bg-gradient-to-b from-primary to-transparent" style={{ animationName: 'none' }} />
    </div>
  );
}
