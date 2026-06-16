'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { DemoSite } from '@/lib/explore/sites';
import DemoSiteCard from '@/components/explore/DemoSiteCard';
import SitePreviewModal from '@/components/explore/SitePreviewModal';

const FAVORITES_KEY = 'aurapost_explore_favorites';
const MAX_FAVORITES = 5;

type Filter = 'all' | 'impact' | 'clarte' | 'authenticite';

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Tous',
  impact: 'Impact',
  clarte: 'Clarté',
  authenticite: 'Authenticité',
};

export default function ExploreClient({ sites }: { sites: DemoSite[] }) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);

  // Favoris persistés en localStorage (jamais de server action pour ça).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(arr.filter((x) => typeof x === 'string').slice(0, MAX_FAVORITES));
      }
    } catch {
      /* localStorage indisponible / JSON corrompu → on ignore */
    }
  }, []);

  function persist(next: string[]) {
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      /* best effort */
    }
  }

  function toggleFavorite(id: string) {
    if (favorites.includes(id)) {
      persist(favorites.filter((f) => f !== id));
      return;
    }
    if (favorites.length >= MAX_FAVORITES) {
      toast.error('Tu as déjà 5 favoris — retire-en un pour ajouter celui-ci');
      return;
    }
    persist([...favorites, id]);
  }

  // « Utiliser ce style » → questionnaire de création (Mandat 2) AVANT génération,
  // en transportant le style du template choisi. La génération a lieu après le questionnaire.
  function handleUse(site: DemoSite) {
    router.push(`/dashboard/website?create=${encodeURIComponent(site.id)}`);
  }

  const counts: Record<Filter, number> = {
    all: sites.length,
    impact: sites.filter((s) => s.style === 'impact').length,
    clarte: sites.filter((s) => s.style === 'clarte').length,
    authenticite: sites.filter((s) => s.style === 'authenticite').length,
  };
  const filters: Filter[] = ['all', 'impact', 'clarte', 'authenticite'];
  const visible = activeFilter === 'all' ? sites : sites.filter((s) => s.style === activeFilter);
  const favoriteSites = sites.filter((s) => favorites.includes(s.id));

  const cardProps = (site: DemoSite) => ({
    site,
    isFavorite: favorites.includes(site.id),
    onToggleFavorite: toggleFavorite,
    onView: setSelectedSite,
    onUse: handleUse,
  });

  return (
    <div>
      {/* En-tête */}
      <header>
        <h1 className="text-2xl font-bold">Trouve le site qui te ressemble</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore 10 exemples, mets tes préférés en favoris, choisis ton point de départ — puis laisse l’IA le personnaliser.
        </p>
      </header>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = activeFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {FILTER_LABEL[f]} ({counts[f]})
            </button>
          );
        })}
      </div>

      {/* Section favoris */}
      {favoriteSites.length > 0 && (
        <section className="mt-6 rounded-2xl bg-muted/30 p-4">
          <h2 className="mb-3 text-sm font-semibold">
            Tes favoris ({favorites.length}/{MAX_FAVORITES})
          </h2>
          <div role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteSites.map((site) => (
              <div role="listitem" key={site.id}>
                <DemoSiteCard {...cardProps(site)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grille principale */}
      <section className="mt-6">
        <div role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((site) => (
            <div role="listitem" key={site.id}>
              <DemoSiteCard {...cardProps(site)} />
            </div>
          ))}
        </div>
      </section>

      <SitePreviewModal
        site={selectedSite}
        isFavorite={selectedSite ? favorites.includes(selectedSite.id) : false}
        onClose={() => setSelectedSite(null)}
        onToggleFavorite={toggleFavorite}
        onUse={handleUse}
      />
    </div>
  );
}
