import type { DemoSite } from '@/lib/explore/sites';
import { cn } from '@/lib/utils';

// Miniature CSS pure du hero d'un site démo (ratio 16:10). Pas d'iframe : 10 rendus
// React complets seraient bien trop lourds à charger d'un coup dans la grille.
// Purement visuel/statique — le hover est géré par la card parente (DemoSiteCard).

const STYLE_LABEL: Record<DemoSite['style'], string> = {
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

export default function SiteThumbnail({ site }: { site: DemoSite }) {
  const accent = site.accentColor;
  const isDark = site.style === 'impact';
  const bg = site.style === 'impact' ? 'bg-zinc-950' : site.style === 'clarte' ? 'bg-gray-50' : 'bg-amber-50';
  const titleColor = site.style === 'impact' ? 'text-white' : site.style === 'authenticite' ? 'text-stone-900' : 'text-gray-900';
  const subColor = isDark ? 'text-zinc-400' : 'text-gray-400';
  const blockColor = isDark ? 'bg-zinc-800' : 'bg-black/10';
  // Le \n des titres démo n'a pas de sens en miniature → on aplatit.
  const title = site.heroTitle.replace(/\n+/g, ' ');

  return (
    <div className={cn('relative aspect-[16/10] w-full overflow-hidden rounded-xl', bg)}>
      {/* Barre de couleur accent en haut */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />

      <div className="flex h-full flex-col justify-between p-3.5 pt-5">
        {/* Hero miniature */}
        <div className="min-h-0">
          <div className="mb-1 h-1.5 w-1/3 rounded-full" style={{ background: accent }} />
          <p className={cn('line-clamp-2 text-xs font-bold leading-tight', titleColor)}>{title}</p>
          <p className={cn('mt-1 truncate text-[10px]', subColor)}>{site.heroSubtitle.replace(/\n+/g, ' ')}</p>
        </div>

        {/* Forces — 3 blocs simulant les cartes */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('h-7 rounded-md', blockColor)}>
              <div className="m-1.5 h-1 w-2/3 rounded-full" style={{ background: accent, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Badge style en coin bas droite */}
      <span
        className="absolute bottom-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
        style={{ background: `${accent}1A`, color: accent }}
      >
        {STYLE_LABEL[site.style]}
      </span>
    </div>
  );
}
