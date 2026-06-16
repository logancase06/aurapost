import { demoPhoto, type DemoSite } from '@/lib/explore/sites';
import { cn } from '@/lib/utils';

// Miniature du hero d'un site démo (ratio 16:10) : VRAIE photo coach + titre superposé.
// Pas d'iframe (10 rendus React complets seraient trop lourds dans la grille) mais plus
// de maquette filaire grise « générée » : on capture l'esprit d'un vrai site.

const STYLE_LABEL: Record<DemoSite['style'], string> = {
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

export default function SiteThumbnail({ site }: { site: DemoSite }) {
  const accent = site.accentColor;
  // Le \n des titres démo n'a pas de sens en miniature → on aplatit.
  const title = site.heroTitle.replace(/\n+/g, ' ');
  // Voile dégradé selon le style pour garder le texte lisible sur la photo.
  const overlay =
    site.style === 'clarte'
      ? 'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.05) 100%)'
      : 'linear-gradient(to top, rgba(10,10,12,0.88) 0%, rgba(10,10,12,0.35) 50%, rgba(10,10,12,0.05) 100%)';
  const dark = site.style !== 'clarte';

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-zinc-200">
      {/* Photo de fond */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={demoPhoto(site, 480, 300)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Voile dégradé pour la lisibilité */}
      <div aria-hidden className="absolute inset-0" style={{ background: overlay }} />
      {/* Barre de couleur accent en haut */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />

      {/* Titre superposé en bas */}
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <div className="mb-1.5 h-1 w-8 rounded-full" style={{ background: accent }} />
        <p className={cn('line-clamp-2 text-xs font-bold leading-tight', dark ? 'text-white' : 'text-gray-900')}>{title}</p>
        <p className={cn('mt-0.5 truncate text-[10px]', dark ? 'text-white/70' : 'text-gray-600')}>
          {site.heroSubtitle.replace(/\n+/g, ' ')}
        </p>
      </div>

      {/* Badge style en coin haut droite */}
      <span
        className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm"
        style={{ background: `${accent}D9` }}
      >
        {STYLE_LABEL[site.style]}
      </span>
    </div>
  );
}
