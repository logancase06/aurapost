'use client';

import { Star, Dumbbell, Flame, Zap, Activity, Mountain } from 'lucide-react';
import { avatar } from '@/lib/stock-images';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  img: number; // index pravatar
}

const TESTIMONIALS: Testimonial[] = [
  { name: 'Karim B.', role: 'Préparation physique · Nice', quote: 'J’ai triplé mes clients en 6 mois. Je ne touche plus à mes posts, je relis et je valide.', img: 12 },
  { name: 'Léa M.', role: 'Coach CrossFit · Lyon', quote: 'Fini la page blanche du dimanche soir. Un mois de contenu en deux minutes, c’est irréel.', img: 5 },
  { name: 'Thomas R.', role: 'Yoga & mobilité · Bordeaux', quote: 'Le ton colle parfaitement à ma voix. Mes abonnés ne voient pas la différence.', img: 33 },
  { name: 'Sarah K.', role: 'Coach nutrition · Paris', quote: 'Mon site vitrine + mes posts au même endroit. J’ai gagné un temps fou.', img: 47 },
  { name: 'Yanis D.', role: 'Boxe & cardio · Marseille', quote: 'Le calendrier éditorial a structuré toute ma communication. Game changer.', img: 68 },
];

// Logos de marques fitness fictives (B&W), affichées sous les témoignages.
const BRANDS = [
  { name: 'IRONHOUSE', Icon: Dumbbell },
  { name: 'PULSE', Icon: Activity },
  { name: 'APEX FIT', Icon: Mountain },
  { name: 'FORGE', Icon: Flame },
  { name: 'MOMENTUM', Icon: Zap },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" style={{ animation: `star-pop 0.4s ease-out ${i * 0.08}s both` }} />
      ))}
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="w-[340px] shrink-0 rounded-lg border border-border bg-card p-6">
      <Stars />
      <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar(t.img)} alt={t.name} width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30" />
        <div>
          <p className="text-sm font-bold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/** Section témoignages — carrousel auto-scroll + logos de marques. */
export default function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="overflow-hidden py-28">
      <div className="mx-auto mb-12 max-w-6xl px-6 text-center">
        <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Ils ne reviendront pas en arrière</h2>
        <p className="mt-3 text-muted-foreground">Des coachs qui ont repris le contrôle de leur contenu.</p>
      </div>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max gap-5 [animation:marquee_36s_linear_infinite] group-hover:[animation-play-state:paused]">
          {loop.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>

      {/* Logos de marques (B&W) */}
      <div className="mx-auto mt-16 max-w-4xl px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Ils s’entraînent avec des coachs AuraPost</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-50 grayscale">
          {BRANDS.map((b) => (
            <span key={b.name} className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-foreground">
              <b.Icon className="h-5 w-5" /> {b.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
