'use client';

// Inspiré de : https://21st.dev/community/components/vaib215/stagger-testimonials/default
// (vaib215/stagger-testimonials — installable via npx shadcn add https://21st.dev/r/vaib215/stagger-testimonials
//  après connexion 21st.dev)
//
// Adaptations par rapport à l'original :
// - Palette AuraPost (hsl CSS variables au lieu de couleurs hardcodées)
// - Grille 3 colonnes responsive (1 / 2 / 3) au lieu de 2 colonnes fixes
// - Ajout du champ `network` pour distinguer Instagram/LinkedIn
// - Animation CSS (fade-up keyframe du tailwind.config.ts du projet) au lieu de Framer Motion
// - Suppression de l'image avatar (utilisation des initiales comme dans Testimonials.tsx)

import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  network?: 'instagram' | 'linkedin';
  accent: string;
}

const ITEMS: Testimonial[] = [
  { name: 'Karim B.', role: 'Prep physique · Nice', quote: "J'ai triple mes clients en 6 mois. Je relis, je valide — c'est tout.", network: 'instagram', accent: '#7C3AED' },
  { name: 'Lea M.', role: 'Coach CrossFit · Lyon', quote: "Fini la page blanche du dimanche soir. Un mois de contenu en deux minutes.", network: 'linkedin', accent: '#A855F7' },
  { name: 'Thomas R.', role: 'Yoga & mobilite · Bordeaux', quote: "Le ton colle parfaitement a ma voix. Mes abonnes ne voient pas la difference.", network: 'instagram', accent: '#6D28D9' },
  { name: 'Sarah K.', role: 'Coach nutrition · Paris', quote: "Mon site vitrine + mes posts au meme endroit. Un temps fou gagne.", network: 'linkedin', accent: '#db2777' },
  { name: 'Yanis D.', role: 'Boxe & cardio · Marseille', quote: "Le calendrier editorial a structure toute ma communication. Game changer.", network: 'instagram', accent: '#8B5CF6' },
  { name: 'Marina C.', role: 'Pilates · Nantes', quote: "En moins d'une heure j'avais 12 posts prets. Je ne peux plus m'en passer.", network: 'linkedin', accent: '#7C3AED' },
];

function InitialAvatar({ name, accent }: { name: string; accent: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
      style={{ background: `linear-gradient(135deg, ${accent}, #A855F7)` }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 etoiles sur 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <figure
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      style={{ animation: `fade-up 0.5s ease-out ${index * 0.1}s both` }}
    >
      <Stars />
      <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <InitialAvatar name={t.name} accent={t.accent} />
        <div>
          <p className="text-sm font-bold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/**
 * Grille de temoignages avec apparition en stagger.
 * Complement a Testimonials.tsx (marquee) — layout statique, SEO-friendly,
 * utilisable dans une section « Ils nous font confiance ».
 */
export default function StaggerTestimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
            Ce que disent les coachs
          </h2>
          <p className="mt-3 text-muted-foreground">
            6 coachs, 6 histoires. Une meme liberation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
