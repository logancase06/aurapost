'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PauseCircle, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { submitCancellationAction, pauseSubscriptionAction } from './actions';

const REASONS = [
  'Trop cher pour moi',
  'Je manque de temps',
  'Le contenu ne me convient pas',
  'J’utilise un autre outil',
  'Je fais une pause dans mon activité',
  'Autre',
];

export default function CancelClient() {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [done, setDone] = useState<'cancelled' | 'paused' | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!reason) {
      toast.error('Sélectionne une raison.');
      return;
    }
    startTransition(async () => {
      const res = await submitCancellationAction({ reason, details });
      if (res.ok) setDone('cancelled');
      else toast.error('Une erreur est survenue.');
    });
  }

  function pause() {
    startTransition(async () => {
      const res = await pauseSubscriptionAction();
      if (res.ok) {
        setDone('paused');
        toast.success('Abonnement mis en pause 1 mois ✦');
      } else toast.error('Action impossible.');
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-2xl font-black uppercase tracking-tight">
          {done === 'paused' ? 'Abonnement en pause' : 'C’est noté, merci'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {done === 'paused'
            ? 'Ton contenu et ton site sont conservés. Tu reprends quand tu veux.'
            : 'Merci pour ton retour, il nous aide à nous améliorer. Tu restes le bienvenu quand tu veux.'}
        </p>
        <Button asChild variant="gradient" className="mt-6">
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Offre de pause en premier (rétention) */}
      <div className="mb-8 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
        <PauseCircle className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 text-xl font-black uppercase tracking-tight">Et si tu faisais une pause ?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mets ton abonnement en pause <strong>1 mois</strong> au lieu d’annuler. Tout est conservé, tu reprends quand tu veux.
        </p>
        <Button onClick={pause} disabled={pending} variant="gradient" className="mt-4">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />} Mettre en pause 1 mois
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-bold">Sinon, dis-nous pourquoi tu pars</h3>
        <p className="mt-1 text-sm text-muted-foreground">Ton retour nous aide à améliorer AuraPost.</p>

        <div className="mt-4 grid gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                'rounded-md border px-4 py-2.5 text-left text-sm transition-all duration-150',
                reason === r ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border hover:border-primary/40'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Un détail à ajouter ? (optionnel)"
          rows={3}
          className="mt-4 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={submit} disabled={pending} variant="destructive">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirmer l’annulation
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Finalement, je reste</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
