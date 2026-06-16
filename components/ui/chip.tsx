'use client';

import { cn } from '@/lib/utils';

// Chip / badge cliquable partagé (reprend le style des suggestions de l'onboarding).
// `selected` optionnel : si fourni, état pressé visuel + aria-pressed.
export function Chip({
  children,
  onClick,
  selected,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}
