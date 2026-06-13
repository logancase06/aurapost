'use client';

import { ScrollReveal } from '@/components/ui/motion-primitives';

function MiniGrid({ filled, dim }: { filled: number; dim?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={
            'aspect-square rounded-sm ' +
            (i < filled
              ? dim
                ? 'bg-muted-foreground/20'
                : 'bg-gradient-to-br from-primary to-accent'
              : 'border border-dashed border-border')
          }
        />
      ))}
    </div>
  );
}

/** Section Avant / Après : deux profils Instagram fictifs côte à côte. */
export default function BeforeAfter() {
  return (
    <section className="clip-diagonal-top relative bg-card/40 py-28">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Avant / Après AuraPost</h2>
          <p className="mt-3 text-muted-foreground">Le même coach. Trente jours d’écart.</p>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* AVANT */}
          <ScrollReveal>
            <div className="rounded-lg border border-border bg-background p-6 opacity-90">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted-foreground/20" />
                <div>
                  <p className="font-bold">@coach.avant</p>
                  <p className="text-xs text-muted-foreground">3 publications · 612 abonnés</p>
                </div>
                <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs font-bold uppercase text-muted-foreground">Avant</span>
              </div>
              <MiniGrid filled={3} dim />
              <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                <li>· Publie une fois par trimestre</li>
                <li>· Légendes basiques, sans accroche</li>
                <li>· Aucun appel à l’action</li>
              </ul>
            </div>
          </ScrollReveal>

          {/* APRÈS */}
          <ScrollReveal delay={0.12}>
            <div className="hover-lift rounded-lg border border-primary/40 bg-background p-6 shadow-lg shadow-primary/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent" />
                <div>
                  <p className="font-bold">@coach.apres</p>
                  <p className="text-xs text-muted-foreground">36 publications · 2 410 abonnés</p>
                </div>
                <span className="ml-auto rounded-md bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-xs font-bold uppercase text-white">Après</span>
              </div>
              <MiniGrid filled={9} />
              <ul className="mt-5 space-y-1.5 text-sm text-foreground/90">
                <li>· 3 publications par semaine, sans effort</li>
                <li>· Accroches travaillées, ton cohérent</li>
                <li>· Un appel à l’action sur chaque post</li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
