'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Heart, Monitor, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CoachSite from '@/templates/coach-site/CoachSite';
import { adaptDemoSiteToCoachSiteData, type DemoSite } from '@/lib/explore/sites';
import { usePrefersReducedMotion } from './use-reduced-motion';

const STYLE_LABEL: Record<DemoSite['style'], string> = {
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

export interface SitePreviewModalProps {
  site: DemoSite | null;
  isFavorite: boolean;
  using?: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onUse: (site: DemoSite) => void;
}

export default function SitePreviewModal({ site, isFavorite, using = false, onClose, onToggleFavorite, onUse }: SitePreviewModalProps) {
  const reduced = usePrefersReducedMotion();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [shown, setShown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Réinitialise l'appareil + déclenche l'animation d'ouverture à chaque nouveau site.
  useEffect(() => {
    if (!site) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset de l'état d'animation quand le modal se ferme; intentionnel
      setShown(false);
      return;
    }
    setDevice('desktop');
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [site]);

  // Escape → fermeture, body scroll lock, focus initial sur le bouton fermer.
  useEffect(() => {
    if (!site) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') trapFocus(e);
    };

    function trapFocus(e: KeyboardEvent) {
      const root = containerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [site, onClose]);

  if (!site) return null;
  const data = adaptDemoSiteToCoachSiteData(site);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu du site ${site.name}`}
        tabIndex={-1}
        className="flex h-full flex-col outline-none"
        style={{
          opacity: shown || reduced ? 1 : 0,
          transform: shown || reduced ? 'scale(1)' : 'scale(0.97)',
          transition: reduced ? 'none' : 'opacity 150ms ease-out, transform 150ms ease-out',
        }}
      >
        {/* Header fixe */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-black/80 px-3 backdrop-blur-md sm:px-4">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aperçu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-white">{site.name}</span>
            <span
              className="hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-block"
              style={{ background: `${site.accentColor}26`, color: '#fff' }}
            >
              {STYLE_LABEL[site.style]}
            </span>
          </div>

          {/* Toggle desktop / mobile */}
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              aria-label="Aperçu ordinateur"
              aria-pressed={device === 'desktop'}
              className={cn('flex h-8 w-9 items-center justify-center rounded-md', device === 'desktop' ? 'text-white' : 'text-white/50 hover:text-white/80')}
              style={device === 'desktop' ? { background: site.accentColor } : undefined}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              aria-label="Aperçu mobile"
              aria-pressed={device === 'mobile'}
              className={cn('flex h-8 w-9 items-center justify-center rounded-md', device === 'mobile' ? 'text-white' : 'text-white/50 hover:text-white/80')}
              style={device === 'mobile' ? { background: site.accentColor } : undefined}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(site.id)}
            aria-label={isFavorite ? `Retirer ${site.name} des favoris` : `Mettre ${site.name} en favori`}
            aria-pressed={isFavorite}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-md border border-white/20 px-2.5 text-xs font-semibold sm:px-3',
              isFavorite ? 'text-red-400' : 'text-white/80 hover:text-white'
            )}
          >
            <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">Favori</span>
          </button>

          <Button
            size="sm"
            onClick={() => onUse(site)}
            disabled={using}
            style={{ background: site.accentColor, color: '#fff' }}
            className="hover:opacity-90"
          >
            {using ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Utiliser ce style →
          </Button>
        </header>

        {/* Corps scrollable — rendu via CoachSite (pas d'iframe) */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div
            className={cn('mx-auto bg-white transition-all', device === 'mobile' ? 'max-w-[375px] shadow-2xl' : 'w-full')}
          >
            <CoachSite data={data} />
          </div>
        </div>

        {/* Barre fixe en bas */}
        <footer className="flex h-16 shrink-0 items-center gap-3 border-t border-white/10 bg-black/80 px-3 backdrop-blur-md sm:px-4">
          <span className="hidden text-sm text-white/70 sm:inline">Ce site te plaît ?</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleFavorite(site.id)}
              aria-pressed={isFavorite}
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? 'En favori' : 'Mettre en favori'}
            </Button>
            <Button
              size="sm"
              onClick={() => onUse(site)}
              disabled={using}
              style={{ background: site.accentColor, color: '#fff' }}
              className="hover:opacity-90"
            >
              {using ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Utiliser et personnaliser →
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
