import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Star, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wall of Love',
  description: 'À quoi ressemble AuraPost vu par les coachs : exemples illustratifs des bénéfices du produit.',
  alternates: { canonical: '/wall-of-love' },
};

// Exemples ILLUSTRATIFS (pas de témoignages réels avant le lancement) : aucune
// identité inventée. Attribution par type de coach uniquement + bandeau explicite.
// À remplacer par de vrais avis collectés (table dédiée) dès qu'ils existent.
const LOVE = [
  { role: 'Coach CrossFit', accent: '#7C3AED', quote: 'Tripler mes clients sans y passer mes soirées : je relis, je valide, c’est tout.' },
  { role: 'Coach remise en forme', accent: '#A855F7', quote: 'Fini la page blanche du dimanche soir. Un mois de contenu en quelques minutes.' },
  { role: 'Coach Hyrox', accent: '#6D28D9', quote: 'Le ton colle à ma voix. Mes abonnés ne verraient pas la différence.' },
  { role: 'Coach yoga', accent: '#8B5CF6', quote: 'Mon site vitrine et mes posts au même endroit : un vrai gain de temps.' },
  { role: 'Préparateur physique', accent: '#7C3AED', quote: 'Le calendrier éditorial structure toute ma communication.' },
  { role: 'Coach running', accent: '#db2777', quote: 'Enfin de la régularité dans mes publications — et ça se voit sur mes messages.' },
  { role: 'Coach musculation', accent: '#A855F7', quote: 'Je déteste écrire. Là, le contenu sort dans mon style, sans effort.' },
  { role: 'Coach nutrition', accent: '#6D28D9', quote: 'Un site partageable à mes prospects, prêt en quelques minutes.' },
  { role: 'Coach bien-être', accent: '#8B5CF6', quote: 'Un produit qui évolue vite : on sent une vraie équipe derrière.' },
];

export default function WallOfLovePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <header className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Heart className="h-6 w-6 text-white" />
        </span>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tighter sm:text-6xl">Wall of Love</h1>
        <p className="mt-3 text-muted-foreground">Ce qu’AuraPost change concrètement, du point de vue des coachs.</p>
        <p className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Exemples illustratifs — les vrais témoignages les remplaceront au lancement.
        </p>
      </header>

      <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {LOVE.map((t) => (
          <figure key={t.role + t.quote.slice(0, 8)} className="mb-5 break-inside-avoid rounded-lg border border-border bg-card p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${t.accent}, #A855F7)` }}>
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-8 py-3.5 font-bold text-white">
          Rejoindre la communauté
        </Link>
      </div>
    </main>
  );
}
