import { HERO_GRID } from '@/lib/stock-images';

/**
 * Filigrane du hero : grille de miniatures fitness en très faible opacité + flou.
 * Perf : seulement 6 images UNIQUES (le navigateur ne fait que 6 requêtes réseau),
 * réutilisées pour densifier la grille. Chargement lazy + faible priorité.
 */
export default function InstagramGridBackground() {
  // 6 tuiles uniques, répétées pour remplir la grille sans multiplier les requêtes.
  const unique = HERO_GRID.slice(0, 6);
  const tiles = Array.from({ length: 30 }, (_, i) => unique[i % unique.length]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden opacity-[0.10] blur-[2px] sm:block"
      style={{
        maskImage: 'radial-gradient(120% 90% at 50% 35%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 50% 35%, #000 30%, transparent 75%)',
      }}
    >
      <div className="grid grid-cols-6 gap-2 p-2 md:grid-cols-10">
        {tiles.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            // @ts-expect-error fetchpriority est valide en HTML, types React en retard
            fetchpriority="low"
            className="aspect-square w-full rounded-sm object-cover grayscale"
          />
        ))}
      </div>
    </div>
  );
}
