'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, animate as fmAnimate } from 'framer-motion';
import { cn } from '@/lib/utils';

// Scroll reveal — apparition en glissant depuis le bas quand la section entre dans le viewport.
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Compteur animé 0 → value au chargement (et quand visible).
export function AnimatedCounter({ value, className, duration = 1 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = fmAnimate(mv, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

// Tabs animés avec indicateur qui glisse (layoutId).
export interface AnimatedTab {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export function AnimatedTabs({ tabs, defaultValue, className }: { tabs: AnimatedTab[]; defaultValue?: string; className?: string }) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value);
  const current = tabs.find((t) => t.value === active) ?? tabs[0];

  return (
    <div className={className}>
      <div className="inline-flex gap-1 rounded-lg border border-border bg-card/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActive(t.value)}
            className={cn(
              'relative rounded-md px-4 py-1.5 text-sm font-semibold transition-colors duration-150',
              active === t.value ? 'text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active === t.value && (
              <motion.span
                layoutId="active-tab"
                className="absolute inset-0 -z-0 rounded-md bg-gradient-to-r from-primary to-accent"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-6"
      >
        {current?.content}
      </motion.div>
    </div>
  );
}
