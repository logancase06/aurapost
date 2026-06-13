'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Magic UI — Shimmer Button. Effet de bordure brillante qui tourne + pression au clic.
export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  background?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ background = 'linear-gradient(110deg,#7C3AED,45%,#A855F7,55%,#7C3AED)', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        style={
          {
            '--speed': '3s',
            background,
          } as React.CSSProperties
        }
        className={cn(
          'group relative z-0 inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg border border-white/10 px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform duration-150 active:scale-[0.97]',
          className
        )}
        {...props}
      >
        {/* spark container */}
        <div className="absolute inset-0 -z-30 overflow-hidden [container-type:size]">
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(20deg)),transparent_0,#ffffff_20deg,transparent_40deg)] [translate:0_0]" />
          </div>
        </div>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {/* highlight */}
        <div className="absolute inset-0 -z-20 rounded-lg" style={{ background }} />
        <div className="pointer-events-none absolute inset-px -z-10 rounded-[7px] bg-[linear-gradient(110deg,#6d28d9,45%,#9333ea,55%,#6d28d9)]" />
      </button>
    );
  }
);
ShimmerButton.displayName = 'ShimmerButton';
