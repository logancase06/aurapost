'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const NAV_SHORTCUTS: Record<string, string> = {
  d: '/dashboard',
  h: '/dashboard/history',
  s: '/dashboard/social',
  w: '/dashboard/website',
  a: '/dashboard/analyze',
  t: '/dashboard/hashtags',
  b: '/dashboard/billing',
  r: '/dashboard/referral',
  x: '/dashboard/settings',
};

const HELP = [
  { keys: ['G', 'D'], label: 'Tableau de bord' },
  { keys: ['G', 'H'], label: 'Historique' },
  { keys: ['G', 'S'], label: 'Publication sociale' },
  { keys: ['G', 'W'], label: 'Site vitrine' },
  { keys: ['G', 'A'], label: 'Analyse profil' },
  { keys: ['G', 'T'], label: 'Hashtags' },
  { keys: ['G', 'B'], label: 'Facturation' },
  { keys: ['G', 'R'], label: 'Parrainage' },
  { keys: ['G', 'X'], label: 'Paramètres' },
  { keys: ['?'], label: 'Afficher / masquer les raccourcis' },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gMode, setGMode] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === '?') {
        setOpen((v) => !v);
        return;
      }

      if (key === 'escape') {
        setGMode(false);
        setOpen(false);
        return;
      }

      if (gMode) {
        setGMode(false);
        const dest = NAV_SHORTCUTS[key];
        if (dest) router.push(dest);
        return;
      }

      if (key === 'g') {
        setGMode(true);
        setTimeout(() => setGMode(false), 1500);
      }
    },
    [gMode, router]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <>
      {gMode && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-primary/30 bg-card/90 px-4 py-2 text-sm font-semibold text-primary backdrop-blur shadow-lg">
          G + …
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" /> Raccourcis clavier
          </DialogTitle>
          <div className="mt-2 space-y-1.5">
            {HELP.map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k, i) => (
                    <span key={i} className="inline-flex items-center justify-center rounded border border-border bg-secondary px-2 py-0.5 font-mono text-xs font-bold">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Les raccourcis sont désactivés dans les champs de saisie.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
