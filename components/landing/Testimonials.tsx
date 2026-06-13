'use client';

import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  accent: string;
}

const TESTIMONIALS: Testimonial[] = [
  { name: 'Karim B.', role: 'Préparation physique · Nice', quote: 'J’ai triplé mes clients en 6 mois. Je ne touche plus à mes posts, je relis et je valide.', accent: '#7C3AED' },
  { name: 'Léa M.', role: 'Coach CrossFit · Lyon', quote: 'Fini la page blanche du dimanche soir. Un mois de contenu en deux minutes, c’est irréel.', accent: '#A855F7' },
  { name: 'Thomas R.', role: 'Yoga & mobilité · Bordeaux', quote: 'Le ton colle parfaitement à ma voix. Mes abonnés ne voient pas la différence.', accent: '#6D28D9' },
  { name: 'Sarah K.', role: 'Coach nutrition · Paris', quote: 'Mon site vitrine + mes posts au même endroit. J’ai gagné un temps fou.', accent: '#8B5CF6' },
  { name: 'Yanis D.', role: 'Boxe & cardio · Marseille', quote: 'Le calendrier éditorial a structuré toute ma communication. Game changer.', accent: '#7C3AED' },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
          style={{ animation: `star-pop 0.4s ease-out ${i * 0.08}s both` }}
        />
      ))}
    </div>
  );
}

function Avatar({ name, accent }: { name: string; accent: string }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
      style={{ background: `linear-gradient(135deg, ${accent}, #A855F7)` }}
    >
      {initials}
    </div>
  );
}

function C({ t }: { t: Testimonial }) {
  return (
    <figure className="w-[340px] shrink-0 rounded-lg border border-border bg-card p-6">
      <Stars />
      <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <Avatar name={t.name} accent={t.accent} />
        <div>
          <p className="text-sm font-bold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/** Section témoignages — carrousel auto-scroll infini (CSS marquee), pause au survol. */
export default function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="overflow-hidden py-28">
      <div className="mx-auto mb-12 max-w-6xl px-6 text-center">
        <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Ils ne reviendront pas en arrière</h2>
        <p className="mt-3 text-muted-foreground">Des coachs qui ont repris le contrôle de leur contenu.</p>
      </div>

      <div className="group relative">
        {/* Dégradés latéraux */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max gap-5 [animation:marquee_36s_linear_infinite] group-hover:[animation-play-state:paused]">
          {loop.map((t, i) => (
            <C key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
