import type { SiteStyle } from '../types';

/**
 * Grain (bruit fractal SVG) en superposition fixe, plein écran, non interactif.
 * Réservé aux styles Impact et Authenticité (Clarté reste épuré, sans grain).
 */
export default function GrainOverlay({ style }: { style: SiteStyle }) {
  if (style === 'clarte') return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: style === 'authenticite' ? 0.065 : 0.035,
        mixBlendMode: 'overlay',
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="cs-grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cs-grain-filter)" opacity="0.45" />
      </svg>
    </div>
  );
}
