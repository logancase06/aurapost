import { HERO_GRID } from '@/lib/stock-images';

/**
 * Filigrane du hero : grille de miniatures de vrais posts fitness, en très faible
 * opacité + flou — montre le produit en arrière-plan sans distraire du texte.
 * Plain <img> (nombreuses petites images externes) + masque radial pour fondre les bords.
 */
export default function InstagramGridBackground() {
  // On répète la liste pour densifier la grille.
  const tiles = [...HERO_GRID, ...HERO_GRID, ...HERO_GRID];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.10] blur-[2px]"
      style={{
        maskImage: 'radial-gradient(120% 90% at 50% 35%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 50% 35%, #000 30%, transparent 75%)',
      }}
    >
      <div className="grid grid-cols-6 gap-2 p-2 sm:grid-cols-8 md:grid-cols-10">
        {tiles.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-square w-full rounded-sm object-cover grayscale"
          />
        ))}
      </div>
    </div>
  );
}
