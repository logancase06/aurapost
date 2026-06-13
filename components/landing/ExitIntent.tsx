'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const STORAGE_KEY = 'aurapost_exit_intent_seen';

/**
 * Exit intent : si l'utilisateur quitte la page par le haut (souris vers la barre
 * d'onglets) sans s'être inscrit, on affiche une offre. Une seule fois par appareil
 * (localStorage). Desktop uniquement (le pointer-leave n'a pas de sens sur tactile).
 */
export default function ExitIntent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return; // tactile → on ignore
    if (localStorage.getItem(STORAGE_KEY)) return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, '1');
        document.removeEventListener('mouseout', onLeave);
      }
    };
    // Laisse 4 s avant d'armer (évite les faux positifs au chargement).
    const armed = setTimeout(() => document.addEventListener('mouseout', onLeave), 4000);
    return () => {
      clearTimeout(armed);
      document.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md overflow-hidden border-primary/40 p-0">
        <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
          <Gift className="mx-auto h-10 w-10" />
          <DialogTitle className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
            Attends — 1 mois offert
          </DialogTitle>
          <DialogDescription className="mt-1 text-white/85">
            Offre réservée aux 10 premiers coachs : un mois de contenu complet, gratuit, sans carte bancaire.
          </DialogDescription>
        </div>
        <div className="p-6 text-center">
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white"
          >
            Je réclame mon mois gratuit
          </Link>
          <button onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Non merci
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
