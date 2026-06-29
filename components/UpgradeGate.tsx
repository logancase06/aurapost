'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UpgradeGateProps {
  /** Intitulé de la feature bloquée — ex: "Publication directe sur les réseaux" */
  featureName: string;
  /** Plan minimum requis. Default: pack_complet */
  requiredPlan?: 'content_only' | 'pack_complet';
  /** Affichage inline (wrapper autour du bouton) ou dialog (modale) */
  mode?: 'inline' | 'dialog';
  children?: React.ReactNode;
  className?: string;
}

const PLAN_LABELS: Record<string, string> = {
  content_only: 'Coach (39€/mois)',
  pack_complet: 'Coach+Site (79€/mois)',
};

const PLAN_FEATURES: Record<string, string[]> = {
  content_only: [
    '12 posts Instagram + LinkedIn / mois',
    'Calendrier éditorial + export iCal',
    'Analyse de profil IA',
    'Variantes illimitées',
  ],
  pack_complet: [
    'Tout le plan Coach',
    'Publication directe LinkedIn + Instagram',
    'Site vitrine coach sur sous-domaine',
    'Édition IA de photos (20/mois)',
    'Support prioritaire',
  ],
};

/** Bouton inline avec cadenas — affiche une modale d'upgrade au clic. */
export function UpgradeGate({
  featureName,
  requiredPlan = 'pack_complet',
  children,
  className,
}: UpgradeGateProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={cn('relative', className)} onClick={() => setOpen(true)}>
        {children ? (
          <div className="cursor-pointer opacity-60 grayscale">{children}</div>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 opacity-75 hover:opacity-100">
            <Lock className="h-3.5 w-3.5" /> {featureName}
          </Button>
        )}
        <div className="absolute inset-0 cursor-pointer rounded-md" />
      </div>

      <UpgradeDialog open={open} onClose={() => setOpen(false)} featureName={featureName} requiredPlan={requiredPlan} />
    </>
  );
}

/** Modale d'upgrade standalone — peut être ouverte programmatiquement. */
export function UpgradeDialog({
  open,
  onClose,
  featureName,
  requiredPlan = 'pack_complet',
}: {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan?: 'content_only' | 'pack_complet';
}) {
  const features = PLAN_FEATURES[requiredPlan] ?? [];
  const planLabel = PLAN_LABELS[requiredPlan] ?? requiredPlan;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden border-primary/30 p-0">
        <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
          <Sparkles className="mx-auto h-10 w-10" />
          <DialogTitle className="mt-3 text-xl font-black uppercase tracking-tight text-white">
            Feature Premium
          </DialogTitle>
          <DialogDescription className="mt-1 text-white/85 text-sm">
            {featureName} est inclus dans le plan {planLabel}.
          </DialogDescription>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ce plan inclut aussi :</p>
          <ul className="space-y-2 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">✦</span> {f}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Button asChild variant="gradient" className="w-full">
              <Link href="/dashboard/billing" onClick={onClose}>
                Passer au plan supérieur →
              </Link>
            </Button>
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
              Pas maintenant
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Bandeau inline dans une page — alternative à la modale pour les pages dédiées. */
export function UpgradeBanner({
  featureName,
  requiredPlan = 'pack_complet',
  className,
}: {
  featureName: string;
  requiredPlan?: 'content_only' | 'pack_complet';
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={cn('flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4', className)}>
      <Lock className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{featureName}</p>
        <p className="text-xs text-muted-foreground">Disponible dans le plan {PLAN_LABELS[requiredPlan]}.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="gradient" className="h-8">
          <Link href="/dashboard/billing">Voir les plans</Link>
        </Button>
        <button onClick={() => setDismissed(true)} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
