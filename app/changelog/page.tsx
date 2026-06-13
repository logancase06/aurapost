import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nouveautés',
  description: 'Les dernières fonctionnalités et améliorations d’AuraPost.',
  alternates: { canonical: '/changelog' },
};

const RELEASES = [
  {
    version: 'v1.0',
    date: '14 juin 2026',
    title: 'Lancement public',
    tag: 'Nouveau',
    items: [
      'Génération de 12 posts/mois (Instagram + LinkedIn) calibrés sur ton profil.',
      'Site vitrine loué, généré par l’IA sur ton sous-domaine.',
      'Calendrier éditorial avec glisser-déposer et export iCal.',
      'Programme de parrainage : 1 mois offert pour toi et ton filleul.',
    ],
  },
  {
    version: 'v0.9',
    date: '7 juin 2026',
    title: 'Croissance & conversion',
    tag: 'Amélioration',
    items: [
      'Page de démonstration personnalisée à envoyer à tes prospects.',
      'Pack de 30 légendes pour tes stories en un clic.',
      'Suggestions intelligentes : 3 thèmes à creuser chaque mois.',
      'Application installable (PWA) avec notifications.',
    ],
  },
  {
    version: 'v0.8',
    date: '1 juin 2026',
    title: 'Fondations',
    tag: 'Amélioration',
    items: [
      'Blog & SEO, galerie publique des coachs.',
      'Notifications in-app, calendrier, analytics.',
      'Conformité RGPD : export et suppression de tes données.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Rocket className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Nouveautés</h1>
          <p className="text-sm text-muted-foreground">AuraPost évolue chaque semaine. Voici ce qui change.</p>
        </div>
      </div>

      <div className="mt-12 space-y-10 border-l border-border pl-6">
        {RELEASES.map((r) => (
          <section key={r.version} className="relative">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{r.version}</span>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold uppercase">{r.tag}</span>
              <time className="text-xs text-muted-foreground">{r.date}</time>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{r.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {r.items.map((i, k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {i}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Crée ton compte
        </Link>{' '}
        et profite de toutes ces nouveautés.
      </p>
    </main>
  );
}
