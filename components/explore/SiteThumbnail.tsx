import { demoPhoto, type DemoSite } from '@/lib/explore/sites';

// Mini-MAQUETTE du site (pas juste une photo) : reflète la STRUCTURE du hero propre à
// chaque style, pour que l'explorateur montre la vraie différence de mise en page.
// Pas d'iframe (10 rendus React complets seraient trop lourds) — une maquette légère
// fidèle à la composition. Photos recadrées par zone + object-position top (visages).

const STYLE_LABEL: Record<DemoSite['style'], string> = {
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

function StyleBadge({ accent, style }: { accent: string; style: DemoSite['style'] }) {
  return (
    <span
      className="absolute right-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm"
      style={{ background: `${accent}D9` }}
    >
      {STYLE_LABEL[style]}
    </span>
  );
}

export default function SiteThumbnail({ site }: { site: DemoSite }) {
  const accent = site.accentColor;
  const title = site.heroTitle.replace(/\n+/g, ' ');

  // ── IMPACT : photo plein cadre + scrim bas-gauche + titre CAPS + bouton ──
  if (site.style === 'impact') {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={demoPhoto(site, 640, 400)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'top center' }} />
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top right, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.5) 42%, rgba(10,10,12,0) 72%)' }} />
        <StyleBadge accent={accent} style={site.style} />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="mb-1.5 h-1 w-7 rounded-full" style={{ background: accent }} />
          <p className="line-clamp-2 text-xs font-extrabold uppercase leading-tight tracking-tight text-white">{title}</p>
          <span className="mt-2 inline-block rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white" style={{ background: accent }}>
            Réserver
          </span>
        </div>
      </div>
    );
  }

  // ── CLARTÉ : centré, titre + pill, photo en ARCHE dessous ──
  if (site.style === 'clarte') {
    return (
      <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl px-3 py-2.5" style={{ background: '#F6F4EC' }}>
        <StyleBadge accent={accent} style={site.style} />
        <p className="line-clamp-1 text-center text-[11px] font-bold leading-tight" style={{ color: '#2A2A28' }}>{title}</p>
        <span className="inline-block rounded-full px-2 py-0.5 text-[8px] font-bold text-white" style={{ background: accent }}>
          Prendre RDV
        </span>
        {/* Arche : aspect FIXE 3/4 + rayon en % → vraie arche, cadrage identique à toute largeur */}
        <div style={{ width: '34%', aspectRatio: '3/4', borderRadius: '50% 50% 6px 6px / 60% 60% 6px 6px', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={demoPhoto(site, 240, 320)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: 'top center' }} />
        </div>
      </div>
    );
  }

  // ── AUTHENTICITÉ : texte à gauche + portrait à droite ──
  return (
    <div className="relative grid aspect-[16/10] w-full grid-cols-[1fr_0.8fr] items-center gap-2 overflow-hidden rounded-xl p-3" style={{ background: '#FAF6F0' }}>
      <StyleBadge accent={accent} style={site.style} />
      <div className="min-w-0">
        <div className="mb-1.5 h-0.5 w-6 rounded-full" style={{ background: accent }} />
        <p className="line-clamp-3 text-[11px] font-semibold italic leading-tight" style={{ color: '#2A2622', fontFamily: 'Georgia, serif' }}>{title}</p>
        <span className="mt-1.5 inline-block text-[8px] font-bold underline" style={{ color: accent, textUnderlineOffset: 2 }}>
          Me contacter →
        </span>
      </div>
      <div className="aspect-[4/5] overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={demoPhoto(site, 280, 350)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: 'top center' }} />
      </div>
    </div>
  );
}
