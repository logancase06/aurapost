'use client';

import { cn } from '@/lib/utils';

// Aceternity UI — Meteors (étoiles filantes CSS).
// Positions déterministes (basées sur l'index) → pas de Math.random pendant le rendu,
// compatible SSR et React Compiler.
export function Meteors({ number = 20, className }: { number?: number; className?: string }) {
  const meteors = Array.from({ length: number }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {meteors.map((i) => (
        <span
          key={i}
          className={cn(
            'absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-violet-400 shadow-[0_0_0_1px_#ffffff10]',
            "before:absolute before:top-1/2 before:h-px before:w-[60px] before:-translate-y-1/2 before:transform before:bg-gradient-to-r before:from-violet-400 before:to-transparent before:content-['']",
            className
          )}
          style={{
            top: `${(i * 37) % 100}%`,
            left: `${(i * 61) % 100}%`,
            animationDelay: `${(i % 7) * 0.45}s`,
            animationDuration: `${4 + (i % 6)}s`,
          }}
        />
      ))}
    </div>
  );
}
