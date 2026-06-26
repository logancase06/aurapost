import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, UserCog, Wand2, CalendarCheck } from 'lucide-react';
import Confetti from '@/components/Confetti';
import SessionRefresher from '@/components/SessionRefresher';

export const metadata: Metadata = {
  title: 'Bienvenue à bord ✦',
  description: 'Votre abonnement AuraPost est actif.',
  robots: { index: false, follow: false },
};

const STEPS = [
  { icon: UserCog, title: 'Complète ton profil', desc: 'Spécialité, ville, ton de voix — 2 minutes.', href: '/onboarding' },
  { icon: Wand2, title: 'Génère ton mois', desc: '8 posts Instagram + 4 LinkedIn calibrés sur toi.', href: '/dashboard' },
  { icon: CalendarCheck, title: 'Approuve & planifie', desc: 'Relis, ajuste, programme ton calendrier.', href: '/dashboard/calendar' },
];

export default function SuccessPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <SessionRefresher />
      <Confetti />
      <div className="aura-glow absolute inset-0" aria-hidden />

      <div className="relative z-10 w-full max-w-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-8 w-8 text-white" />
        </span>
        <h1 className="mt-6 text-4xl font-black uppercase tracking-tighter sm:text-5xl">Bienvenue à bord ✦</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Ton abonnement est actif. Tout est prêt pour que tu n’aies plus jamais à improviser ton contenu.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Link
              key={s.title}
              href={s.href}
              className="hover-lift group rounded-lg border border-border bg-card p-5 text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Étape {i + 1}</p>
              <h2 className="mt-1 font-black tracking-tight group-hover:text-primary">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/onboarding"
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-base font-bold text-white"
        >
          Commencer maintenant <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
