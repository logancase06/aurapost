'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DemoSite } from '@/lib/explore/sites';
import SiteThumbnail from './SiteThumbnail';
import { usePrefersReducedMotion } from './use-reduced-motion';

const STYLE_LABEL: Record<DemoSite['style'], string> = {
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

export interface DemoSiteCardProps {
  site: DemoSite;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onView: (site: DemoSite) => void;
  onUse: (site: DemoSite) => void;
}

export default function DemoSiteCard({ site, isFavorite, onToggleFavorite, onView }: DemoSiteCardProps) {
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [bump, setBump] = useState(false);

  function toggle() {
    onToggleFavorite(site.id);
    if (reduced) return;
    setBump(true);
    setTimeout(() => setBump(false), 160);
  }

  return (
    <article
      role="article"
      aria-label={`Site de ${site.name}, style ${site.style}`}
      className="flex flex-col"
    >
      {/* Miniature cliquable → aperçu */}
      <button
        type="button"
        onClick={() => onView(site)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Voir l'aperçu du site ${site.name}`}
        className="relative block w-full rounded-xl transition-all duration-200 motion-reduce:transition-none"
        style={{
          transform: hovered && !reduced ? 'scale(1.02)' : 'scale(1)',
          boxShadow: hovered ? '0 20px 40px -16px rgba(0,0,0,0.35)' : 'none',
          outline: hovered ? `2px solid ${site.accentColor}` : '2px solid transparent',
          outlineOffset: 2,
        }}
      >
        <SiteThumbnail site={site} />
        {isFavorite && (
          <span
            aria-hidden
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm shadow"
          >
            ⭐
          </span>
        )}
      </button>

      {/* Métadonnées */}
      <div className="mt-3 flex-1">
        <p className="text-sm font-semibold leading-tight">{site.name}</p>
        <p className="text-xs text-muted-foreground">
          {site.specialty} · {site.city}
        </p>
        <span
          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: `${site.accentColor}1A`, color: site.accentColor }}
        >
          {STYLE_LABEL[site.style]}
        </span>
        <div className="mt-2 flex flex-wrap gap-1">
          {site.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(site)} className="flex-1">
          Voir →
        </Button>
        <button
          type="button"
          onClick={toggle}
          aria-label={isFavorite ? `Retirer ${site.name} des favoris` : `Ajouter ${site.name} aux favoris`}
          aria-pressed={isFavorite}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border border-border transition-transform duration-150 motion-reduce:transition-none',
            isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ transform: bump && !reduced ? 'scale(1.3)' : 'scale(1)' }}
        >
          <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}
