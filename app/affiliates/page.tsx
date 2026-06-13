import type { Metadata } from 'next';
import Link from 'next/link';
import { Percent, Link2, Wallet, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Programme d’affiliation',
  description: 'Gagne 30% de commission récurrente en recommandant AuraPost. Idéal pour les créateurs et influenceurs fitness.',
  alternates: { canonical: '/affiliates' },
};

const STEPS = [
  { icon: Link2, title: 'Récupère ton lien', desc: 'Un lien d’affiliation unique et tracké, depuis ton espace.' },
  { icon: TrendingUp, title: 'Partage-le', desc: 'À ta communauté, tes clients coachs, ton audience fitness.' },
  { icon: Wallet, title: 'Touche 30% à vie', desc: 'Sur chaque abonnement actif que tu apportes, chaque mois.' },
];

export default function AffiliatesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <header className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Percent className="h-7 w-7 text-white" />
        </span>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tighter sm:text-6xl">30% à vie</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Recommande AuraPost et touche <strong>30% de commission récurrente</strong> sur chaque coach que tu apportes.
          Tant qu’il reste client, tu es payé.
        </p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="hover-lift relative rounded-lg border border-border bg-card p-6">
            <span className="absolute right-4 top-2 text-5xl font-black text-white/[0.04]">{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-black tracking-tight">{s.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-4 rounded-lg border border-border bg-card p-8 sm:grid-cols-3 sm:text-center">
        <div>
          <p className="text-3xl font-black text-primary">30%</p>
          <p className="text-sm text-muted-foreground">commission récurrente</p>
        </div>
        <div>
          <p className="text-3xl font-black text-primary">90 j</p>
          <p className="text-sm text-muted-foreground">durée du cookie de tracking</p>
        </div>
        <div>
          <p className="text-3xl font-black text-primary">∞</p>
          <p className="text-sm text-muted-foreground">filleuls illimités</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-8 py-3.5 font-bold text-white">
          Devenir affilié
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          Déjà coach AuraPost ? Ton{' '}
          <Link href="/dashboard/referral" className="text-primary hover:underline">
            espace parrainage
          </Link>{' '}
          t’attend.
        </p>
      </div>
    </main>
  );
}
