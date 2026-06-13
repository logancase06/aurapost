'use client';

import { useCallback, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/motion-primitives';
import { AFTER_POSTS, unsplash, FITNESS_PHOTO_IDS } from '@/lib/stock-images';

function ProfileHeader({ handle, posts, followers, accent }: { handle: string; posts: string; followers: string; accent: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
      <div className={'h-10 w-10 rounded-full ' + (accent ? 'bg-gradient-to-br from-primary to-accent' : 'bg-muted-foreground/20 grayscale')} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{handle}</p>
        <p className="text-[11px] text-muted-foreground">
          {posts} publications · {followers} abonnés
        </p>
      </div>
    </div>
  );
}

// Grille « avant » : 3 posts ternes + 6 cases vides.
function BeforeGrid() {
  const dull = [FITNESS_PHOTO_IDS[3], FITNESS_PHOTO_IDS[6], FITNESS_PHOTO_IDS[13]];
  return (
    <div className="h-full bg-background">
      <ProfileHeader handle="@coach.avant" posts="3" followers="612" accent={false} />
      <div className="grid grid-cols-3 gap-1 p-1">
        {Array.from({ length: 9 }).map((_, i) =>
          i < 3 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={unsplash(dull[i], 240, 240, 55)} alt="" className="aspect-square w-full object-cover opacity-50 grayscale" loading="lazy" />
          ) : (
            <div key={i} className="aspect-square w-full rounded-sm border border-dashed border-border bg-card" />
          )
        )}
      </div>
    </div>
  );
}

// Grille « après » : 9 vraies photos fitness + légendes.
function AfterGrid() {
  return (
    <div className="h-full bg-background">
      <ProfileHeader handle="@coach.apres" posts="36" followers="2 410" accent />
      <div className="grid grid-cols-3 gap-1 p-1">
        {AFTER_POSTS.map((p) => (
          <div key={p.id} className="group relative aspect-square w-full overflow-hidden rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <p className="line-clamp-2 text-[8px] font-semibold leading-tight text-white">{p.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonSlider() {
  const [pos, setPos] = useState(55); // % révélé du « après »
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(4, Math.min(96, pct)));
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto max-w-2xl select-none overflow-hidden rounded-xl border border-border shadow-2xl"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      style={{ touchAction: 'none' }}
    >
      {/* Couche AVANT (fond) */}
      <div className="relative">
        <span className="absolute left-3 top-3 z-20 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avant</span>
        <BeforeGrid />
      </div>

      {/* Couche APRÈS (au-dessus, clippée) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <span className="absolute right-3 top-3 z-20 rounded-md bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Après</span>
        <AfterGrid />
      </div>

      {/* Poignée */}
      <div className="absolute inset-y-0 z-30 w-0.5 bg-white/80" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-primary shadow-lg">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/** Section Avant / Après — slider de comparaison interactif avec vraies photos. */
export default function BeforeAfter() {
  return (
    <section className="clip-diagonal-top relative bg-card/40 py-28">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Avant / Après AuraPost</h2>
          <p className="mt-3 text-muted-foreground">Le même coach. Trente jours d’écart. Glisse pour comparer 👇</p>
        </ScrollReveal>

        <div className="mt-14">
          <ComparisonSlider />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { t: '3 → 36 publications', d: 'Une présence régulière, enfin.' },
            { t: '612 → 2 410 abonnés', d: 'Une audience locale qualifiée.' },
            { t: 'Basique → Pro', d: 'Accroches, légendes, appels à l’action.' },
          ].map((s) => (
            <div key={s.t} className="rounded-lg border border-border bg-background p-5 text-center">
              <p className="text-lg font-black text-primary">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
