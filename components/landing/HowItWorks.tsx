'use client';

import { ScrollReveal } from '@/components/ui/motion-primitives';
import { PhoneFrame } from '@/components/ui/device-frames';

const STEPS = [
  { n: '01', title: 'Décris ton activité', desc: 'Spécialité, ville, ton de voix. Une minute, une seule fois.', img: '/mockups/phone-stats.png' },
  { n: '02', title: 'Génère ton mois', desc: '8 posts Instagram + 4 LinkedIn calibrés sur ton profil, en 2 minutes.', img: '/mockups/phone-posts.png' },
  { n: '03', title: 'Approuve & publie', desc: 'Relis, ajuste, programme. Ton site et ton calendrier sont prêts.', img: '/mockups/phone-site.png' },
];

/** Section « Comment ça marche » : 3 étapes illustrées par des mockups iPhone du vrai produit. */
export default function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">Trois étapes. Zéro page blanche.</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.12}>
              <div className="relative flex flex-col items-center text-center">
                <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 select-none text-[7rem] font-black leading-none text-foreground/[0.06]">
                  {s.n}
                </span>
                <PhoneFrame src={s.img} alt={`Étape ${s.n} — ${s.title}`} />
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
