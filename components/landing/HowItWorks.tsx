'use client';

import { ScrollReveal } from '@/components/ui/motion-primitives';

// Illustrations SVG custom (pas d'icônes stock) — trait épais, style éditorial.
function ProfileArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      <circle cx="60" cy="42" r="20" />
      <path d="M26 96c0-19 15-30 34-30s34 11 34 30" />
      <path d="M88 30l6-6m0 0l6 6m-6-6v16" className="text-accent" />
    </svg>
  );
}

function GenerateArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 14l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" />
      <circle cx="96" cy="30" r="4" />
      <circle cx="26" cy="92" r="5" />
    </svg>
  );
}

function PublishArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 64L100 24 76 104 60 72z" />
      <path d="M60 72l16-16" />
    </svg>
  );
}

const STEPS = [
  { n: '01', title: 'Décris ton activité', desc: 'Spécialité, ville, ton de voix. Une minute, une seule fois.', Art: ProfileArt },
  { n: '02', title: 'Génère ton mois', desc: '8 posts Instagram + 4 LinkedIn calibrés sur ton profil, en 2 minutes.', Art: GenerateArt },
  { n: '03', title: 'Approuve & publie', desc: 'Relis, ajuste, programme. Ton calendrier éditorial est prêt.', Art: PublishArt },
];

/** Section « Comment ça marche » : 3 étapes, numéros géants, illustrations SVG custom. */
export default function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">Trois étapes. Zéro page blanche.</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.12}>
              <div className="relative text-center">
                <span className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 select-none text-[8rem] font-black leading-none text-white/[0.03]">
                  {s.n}
                </span>
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.Art />
                </div>
                <h3 className="mt-6 text-xl font-black uppercase tracking-tight">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
