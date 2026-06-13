'use client';

import { useEffect, useState } from 'react';

/**
 * Compteur « live » du hero : « X posts générés ce mois ». Part d'une base crédible
 * dérivée du jour du mois et s'incrémente lentement pour donner une impression d'activité.
 * Chiffre indicatif (pas de donnée réelle exposée).
 */
export default function LiveCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    // Base crédible : ~420 posts/jour cumulés sur le mois.
    const base = 1240 + dayOfMonth * 418 + Math.floor(Math.random() * 60);

    // Animation d'apparition 0 → base.
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(base * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Incrément lent ensuite (toutes les 3–6 s).
    const interval = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 3) + 1), 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-sm font-semibold backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
      </span>
      <span className="tabular-nums font-black text-foreground">{count.toLocaleString('fr-FR')}</span>
      <span className="text-muted-foreground">posts générés ce mois</span>
    </span>
  );
}
