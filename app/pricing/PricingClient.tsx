'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Check, ShieldCheck, ChevronDown, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { MovingBorderCard } from '@/components/ui/moving-border';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PLANS, formatPrice, formatAnnualMonthly, ANNUAL_DISCOUNT, FREE_TRIAL_LABEL, type PlanDef } from '@/lib/plans';

const FAQ = [
  {
    q: 'Comment AuraPost connaît mon style ?',
    a: 'À l’inscription, tu décris ta spécialité, ta ville et ton ton de voix. Si tu colles ton profil Instagram, l’IA analyse même tes derniers posts pour imiter ton style naturel.',
  },
  {
    q: 'Je peux modifier les posts générés ?',
    a: 'Bien sûr. Tu approuves, tu rejettes, tu demandes des variantes, tu copies et tu ajustes. Rien n’est publié automatiquement sans ton accord.',
  },
  {
    q: 'C’est quoi le site vitrine “loué” ?',
    a: 'Avec le Pack Complet, AuraPost génère et héberge un vrai site vitrine sur ton-nom.aurapost.fr, rédigé par l’IA à partir de ton profil. Tu le partages à tes prospects.',
  },
  {
    q: 'Je peux annuler quand je veux ?',
    a: 'Oui, sans engagement. Et si tu hésites, tu peux mettre ton abonnement en pause un mois au lieu d’annuler.',
  },
  {
    q: 'Et si ça ne me convient pas ?',
    a: 'Garantie satisfait ou remboursé pendant 30 jours. Tu testes sans risque.',
  },
];

function PriceTag({ plan, annual }: { plan: PlanDef; annual: boolean }) {
  return (
    <p className="mt-3 flex items-baseline gap-1">
      <span className="text-4xl font-black">{annual ? formatAnnualMonthly(plan) : formatPrice(plan)}</span>
      <span className="text-sm font-normal text-muted-foreground">/ mois</span>
      {annual && (
        <span className="ml-2 rounded bg-[hsl(var(--success))]/15 px-1.5 py-0.5 text-xs font-bold text-[hsl(var(--success))]">
          -{Math.round(ANNUAL_DISCOUNT * 100)}%
        </span>
      )}
    </p>
  );
}

function PlanCard({ plan, annual }: { plan: PlanDef; annual: boolean }) {
  const annualTotal = Math.round((plan.amount * (1 - ANNUAL_DISCOUNT) * 12) / 100);
  const inner = (
    <div className="flex h-full flex-col p-8">
      {plan.featured && (
        <span className="mb-3 inline-flex w-fit rounded-md bg-gradient-to-r from-primary to-accent px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
          Recommandé
        </span>
      )}
      <h2 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <PriceTag plan={plan} annual={annual} />
      {annual && <p className="mt-1 text-xs text-muted-foreground">soit {annualTotal} € / an</p>}
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
          </li>
        ))}
      </ul>
      {plan.featured ? (
        <ShimmerButton onClick={() => (window.location.href = '/register')} className="mt-8 w-full">
          Démarrer maintenant
        </ShimmerButton>
      ) : (
        <Button asChild variant="outline" className="mt-8 w-full">
          <Link href="/register">Commencer</Link>
        </Button>
      )}
    </div>
  );

  return plan.featured ? (
    <MovingBorderCard containerClassName="h-full" className="h-full">
      {inner}
    </MovingBorderCard>
  ) : (
    <div className="hover-lift h-full rounded-lg border border-border bg-card">{inner}</div>
  );
}

export default function PricingClient() {
  const [annual, setAnnual] = useState(true);
  const [open, setOpen] = useState<number | null>(0);
  const [exitOpen, setExitOpen] = useState(false);

  // Popup de sortie spécifique au pricing (1×/appareil).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (localStorage.getItem('aurapost_pricing_exit')) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setExitOpen(true);
        localStorage.setItem('aurapost_pricing_exit', '1');
        document.removeEventListener('mouseout', onLeave);
      }
    };
    const armed = setTimeout(() => document.addEventListener('mouseout', onLeave), 5000);
    return () => {
      clearTimeout(armed);
      document.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AuraPost
          </Link>
          <Button asChild size="sm" variant="gradient">
            <Link href="/register">Commencer</Link>
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase tracking-tighter sm:text-6xl">Choisis ton arme</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Deux offres claires, sans engagement. Annule ou mets en pause quand tu veux.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-4 py-1 text-sm font-semibold text-[hsl(var(--success))]">
            ✦ {FREE_TRIAL_LABEL} · sans carte bancaire
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-semibold transition-colors', !annual ? 'bg-gradient-to-r from-primary to-accent text-white' : 'text-muted-foreground')}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-semibold transition-colors', annual ? 'bg-gradient-to-r from-primary to-accent text-white' : 'text-muted-foreground')}
            >
              Annuel <span className="ml-1 text-xs opacity-90">-20%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} annual={annual} />
          ))}
        </div>

        {/* Garantie */}
        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 px-5 py-4 text-center">
          <ShieldCheck className="h-6 w-6 shrink-0 text-[hsl(var(--success))]" />
          <p className="text-sm font-semibold">Satisfait ou remboursé pendant 30 jours. Sans condition.</p>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center text-3xl font-black uppercase tracking-tight">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                  aria-expanded={open === i}
                >
                  {item.q}
                  <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform duration-200', open === i && 'rotate-180')} />
                </button>
                <div className={cn('grid transition-all duration-200', open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popup de sortie */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-md overflow-hidden border-primary/40 p-0">
          <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
            <Gift className="mx-auto h-10 w-10" />
            <DialogTitle className="mt-3 text-2xl font-black uppercase tracking-tight text-white">Avant de partir</DialogTitle>
            <DialogDescription className="mt-1 text-white/85">
              Essaie AuraPost gratuitement pendant 14 jours — sans carte bancaire. Tu génères ton premier mois de contenu, tu juges sur pièces.
            </DialogDescription>
          </div>
          <div className="p-6 text-center">
            <Link
              href="/register"
              onClick={() => setExitOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white"
            >
              Démarrer mes 14 jours gratuits
            </Link>
            <button onClick={() => setExitOpen(false)} className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Non merci
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
