'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Printer } from 'lucide-react';

interface Slide {
  kicker: string;
  title: string;
  body: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    kicker: '01 · Le problème',
    title: 'Vos distributeurs publient mal — ou pas du tout',
    body: (
      <ul className="space-y-3 text-lg text-white/70">
        <li>• 80 % des distributeurs n’ont ni le temps ni les codes pour créer du contenu social.</li>
        <li>• Résultat : posts incohérents, hors charte, parfois non conformes.</li>
        <li>• La marque perd en visibilité locale et en contrôle de son image.</li>
      </ul>
    ),
  },
  {
    kicker: '02 · La solution',
    title: 'AuraPost génère leur contenu, automatiquement',
    body: (
      <p className="text-xl text-white/70">
        Chaque distributeur reçoit <strong className="text-white">12 posts/mois</strong> (Instagram &amp; LinkedIn),
        calibrés sur la charte de la marque, prêts à publier. Zéro effort côté distributeur, contrôle total côté réseau.
        <br /><br />
        <a href="/demo-live?token=demo" className="text-accent underline">▶ Voir la démo live →</a>
      </p>
    ),
  },
  {
    kicker: '03 · Comment ça marche',
    title: '3 étapes',
    body: (
      <ol className="space-y-4 text-lg text-white/70">
        <li><strong className="text-white">1.</strong> Vous définissez la marque (logo, couleurs, ton, mots interdits, templates validés).</li>
        <li><strong className="text-white">2.</strong> Vous importez vos distributeurs (CSV) → un espace prêt pour chacun.</li>
        <li><strong className="text-white">3.</strong> Le contenu coule chaque mois. Vous suivez tout depuis le reporting global.</li>
      </ol>
    ),
  },
  {
    kicker: '04 · Ce qu’on génère',
    title: 'Posts + site + planning',
    body: (
      <div className="grid grid-cols-3 gap-6 text-center">
        {[['12', 'posts / mois / distributeur'], ['1', 'site vitrine par distributeur'], ['∞', 'variantes & calendrier']].map(([n, l]) => (
          <div key={l} className="rounded-2xl border border-white/15 p-6">
            <div className="text-5xl font-black text-accent">{n}</div>
            <div className="mt-2 text-sm text-white/60">{l}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    kicker: '05 · Marque & conformité',
    title: 'Brand kit imposé + conformité MLM',
    body: (
      <ul className="space-y-3 text-lg text-white/70">
        <li>• Logo, palette et ton hérités par chaque distributeur — impossible de dévier.</li>
        <li>• Templates de contenu validés par la marque.</li>
        <li>• Liste noire automatique : « revenus », « liberté financière »… <span className="text-white">bloqués à la génération</span>.</li>
        <li>• Badge « Conforme marque ✓ » sur chaque post.</li>
      </ul>
    ),
  },
  {
    kicker: '06 · Reporting',
    title: 'Pilotage global du réseau',
    body: (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[['127', 'posts ce mois'], ['89 %', 'approuvés'], ['4/5', 'actifs'], ['2', 'sites publiés']].map(([n, l]) => (
          <div key={l} className="rounded-xl border border-white/15 p-5 text-center">
            <div className="text-3xl font-extrabold text-white">{n}</div>
            <div className="mt-1 text-xs text-white/60">{l}</div>
          </div>
        ))}
        <p className="col-span-full mt-2 text-sm text-white/50">Données d’exemple · reporting réel par organisation dans le produit.</p>
      </div>
    ),
  },
  {
    kicker: '07 · Tarifs',
    title: 'Un prix par taille de réseau',
    body: (
      <div className="grid grid-cols-3 gap-4 text-center">
        {[['Starter', '997 €', '≤ 50'], ['Growth', '2 997 €', '≤ 200'], ['Enterprise', 'Sur devis', '500+']].map(([n, p, l]) => (
          <div key={n} className="rounded-2xl border border-white/15 p-6">
            <div className="text-sm font-bold uppercase tracking-widest text-accent">{n}</div>
            <div className="mt-2 text-3xl font-black text-white">{p}</div>
            <div className="mt-1 text-xs text-white/50">{l} distributeurs</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    kicker: '08 · Roadmap',
    title: 'Ce qui vient',
    body: (
      <ul className="space-y-3 text-lg text-white/70">
        <li>• Publication automatique (OAuth Instagram / LinkedIn).</li>
        <li>• Génération de visuels de posts.</li>
        <li>• Analytics sociaux réels (portée, engagement).</li>
        <li>• Marque blanche complète pour les agences.</li>
      </ul>
    ),
  },
  {
    kicker: '09 · Prochaine étape',
    title: 'Un appel de 20 minutes',
    body: (
      <p className="text-xl text-white/70">
        On configure votre réseau ensemble et vous voyez le premier mois de contenu généré en direct.
        <br /><br />
        <a href="/agency-contact" className="rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white">Demander une démo →</a>
      </p>
    ),
  },
];

export default function PitchDeck() {
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((p) => Math.max(0, Math.min(SLIDES.length - 1, p + d))), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const s = SLIDES[i];

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F] text-white">
      {/* Barre d'outils (masquée à l'impression) */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3 print:hidden">
        <span className="text-sm font-black uppercase tracking-widest text-accent">AuraPost for Teams</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50">{i + 1} / {SLIDES.length}</span>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-md border border-white/15 p-1.5 hover:bg-white/10" aria-label="Plein écran"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={() => window.print()} className="rounded-md border border-white/15 p-1.5 hover:bg-white/10" aria-label="Imprimer"><Printer className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Slide courante (à l'écran) + toutes les slides (à l'impression) */}
      <div className="relative flex flex-1 items-center justify-center px-8 py-16 print:hidden">
        <div key={i} className="animate-fade-in mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-accent">{s.kicker}</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{s.title}</h2>
          <div className="mt-8">{s.body}</div>
        </div>

        <button onClick={() => go(-1)} disabled={i === 0} className="absolute left-4 rounded-full border border-white/15 p-3 disabled:opacity-20 hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} className="absolute right-4 rounded-full border border-white/15 p-3 disabled:opacity-20 hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {/* Version imprimable : toutes les slides empilées */}
      <div className="hidden print:block">
        {SLIDES.map((sl, k) => (
          <div key={k} className="break-after-page p-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{sl.kicker}</p>
            <h2 className="mt-3 text-3xl font-black text-black">{sl.title}</h2>
            <div className="mt-6 text-black">{sl.body}</div>
          </div>
        ))}
      </div>

      {/* Pagination par points */}
      <div className="flex items-center justify-center gap-2 pb-6 print:hidden">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-accent' : 'w-2 bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}
