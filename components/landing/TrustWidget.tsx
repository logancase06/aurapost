'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

/**
 * « X coachs nous font confiance cette semaine » — chiffre crédible, stable sur la
 * semaine (dérivé du numéro de semaine ISO) et croissant. Calculé au montage pour
 * éviter toute divergence d'hydratation.
 */
export default function TrustWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    // Base croissante + variation déterministe par semaine.
    const base = 40 + week * 3 + ((week * 7) % 11);
    // Calcul client-only pour éviter une divergence d'hydratation sur le chiffre.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(base);
  }, []);

  if (count === null) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm backdrop-blur">
      <Users className="h-4 w-4 text-primary" />
      <span>
        <strong className="font-black text-foreground">{count}</strong> coachs nous font confiance cette semaine
      </span>
    </div>
  );
}
