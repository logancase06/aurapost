'use client';

import { UserCircle, Sparkles, CalendarCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/motion-primitives';

const STEPS = [
  {
    n: '01',
    icon: UserCircle,
    title: 'Décris ton activité',
    desc: 'Spécialité, ville, ton de voix. Une minute, une seule fois.',
    preview: [
      { label: 'Spécialité', value: 'Coach Nutrition · Paris' },
      { label: 'Ton', value: 'Bienveillant & direct' },
      { label: 'Cible', value: 'Femmes 30–50 ans' },
    ],
  },
  {
    n: '02',
    icon: Sparkles,
    title: 'Génère ton mois',
    desc: '8 posts Instagram + 4 LinkedIn calibrés sur ton profil, en 2 minutes.',
    preview: [
      { label: '8 posts Instagram', value: 'Hooks · Légendes · Hashtags' },
      { label: '4 posts LinkedIn', value: "Contenu d'autorité" },
      { label: '1 site vitrine', value: "Rédigé par l'IA" },
    ],
  },
  {
    n: '03',
    icon: CalendarCheck,
    title: 'Approuve & publie',
    desc: 'Relis, ajuste, programme. Ton site et ton calendrier sont prêts.',
    preview: [
      { label: 'Éditeur intégré', value: 'Corrige en un clic' },
      { label: 'Calendrier', value: "Programme à l'avance" },
      { label: 'Site en ligne', value: 'Sous-domaine prêt' },
    ],
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">Trois étapes. Zéro page blanche.</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.12}>
              <div className="relative flex flex-col">
                {/* Numéro fantôme */}
                <span className="pointer-events-none absolute -top-10 left-0 select-none text-[7rem] font-black leading-none text-foreground/[0.06]">
                  {s.n}
                </span>

                {/* Card */}
                <div
                  className="relative mt-10 flex flex-col overflow-hidden rounded-xl border"
                  style={{ borderColor: 'var(--landing-line)', background: 'var(--landing-paper)' }}
                >
                  {/* En-tête icône */}
                  <div
                    className="flex items-center gap-3 border-b px-5 py-4"
                    style={{ borderColor: 'var(--landing-line)', background: 'var(--landing-paper-2)' }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'var(--landing-sapin)' }}
                    >
                      <s.icon className="h-4 w-4 text-white" />
                    </span>
                    <h3 className="font-black uppercase tracking-tight">{s.title}</h3>
                  </div>

                  {/* Rows preview */}
                  <ul className="flex flex-col divide-y divide-border px-5 py-1">
                    {s.preview.map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                        <span style={{ color: 'var(--landing-muted)' }}>{row.label}</span>
                        <span className="text-right font-semibold" style={{ color: 'var(--landing-ink)' }}>
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Barre accent */}
                  <div className="h-1 w-full" style={{ background: 'var(--landing-sapin)' }} />
                </div>

                {/* Description sous la card */}
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
