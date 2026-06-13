import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wall of Love',
  description: 'Ce que les coachs disent d’AuraPost. Des résultats réels, des mots vrais.',
  alternates: { canonical: '/wall-of-love' },
};

const LOVE = [
  { name: 'Karim B.', city: 'Nice', accent: '#7C3AED', quote: 'J’ai triplé mes clients en 6 mois. Je relis, je valide, c’est tout.' },
  { name: 'Léa M.', city: 'Lyon', accent: '#A855F7', quote: 'Fini la page blanche du dimanche soir. Un mois de contenu en 2 minutes, c’est irréel.' },
  { name: 'Thomas R.', city: 'Bordeaux', accent: '#6D28D9', quote: 'Le ton colle parfaitement à ma voix. Mes abonnés ne voient pas la différence.' },
  { name: 'Sarah K.', city: 'Paris', accent: '#8B5CF6', quote: 'Mon site vitrine + mes posts au même endroit. J’ai gagné un temps fou.' },
  { name: 'Yanis D.', city: 'Marseille', accent: '#7C3AED', quote: 'Le calendrier éditorial a structuré toute ma communication. Game changer.' },
  { name: 'Julie F.', city: 'Cagnes-sur-Mer', accent: '#db2777', quote: 'Première vraie régularité depuis 3 ans. Et ça se voit sur mes DM.' },
  { name: 'Marc D.', city: 'Antibes', accent: '#A855F7', quote: 'Je déteste écrire. AuraPost écrit mieux que moi, dans mon style. Bluffant.' },
  { name: 'Inès L.', city: 'Toulouse', accent: '#6D28D9', quote: 'Le site loué m’a apporté 4 prospects le premier mois. Rentabilisé direct.' },
  { name: 'Hugo P.', city: 'Montpellier', accent: '#8B5CF6', quote: 'Support au top, produit qui évolue vite. On sent une vraie équipe derrière.' },
];

function Avatar({ name, accent }: { name: string; accent: string }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: `linear-gradient(135deg, ${accent}, #A855F7)` }}>
      {initials}
    </div>
  );
}

export default function WallOfLovePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <header className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Heart className="h-6 w-6 text-white" />
        </span>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tighter sm:text-6xl">Wall of Love</h1>
        <p className="mt-3 text-muted-foreground">Ce que les coachs ressentent vraiment. Sans filtre.</p>
      </header>

      <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {LOVE.map((t) => (
          <figure key={t.name} className="mb-5 break-inside-avoid rounded-lg border border-border bg-card p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <Avatar name={t.name} accent={t.accent} />
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.city}</p>
              </div>
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
