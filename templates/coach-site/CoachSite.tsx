import { themeFor, accentForSpeciality } from './theme';
import type { CoachSiteData, SiteStyle } from './types';
import SiteNav from './components/SiteNav';
import GrainOverlay from './components/GrainOverlay';
import HeroSection from './components/HeroSection';
import ForcesSection from './components/ForcesSection';
import AProposSection from './components/AProposSection';
import ServicesSection from './components/ServicesSection';
import ResultsSection from './components/ResultsSection';
import TemoignagesSection from './components/TemoignagesSection';
import ContactSection from './components/ContactSection';
import SiteFooter from './components/SiteFooter';

// ─────────────────────────────────────────────────────────────────────────────
// Assembleur du site vitrine coach. 3 styles distincts pilotés par `data.style` :
//   impact        → hero sombre, typographie massive (Bebas), vibe athlète/prépa
//   clarte        → épuré, beaucoup de blanc, sans-serif moderne (Jakarta), bienêtre
//   authenticite  → hero photo + grain, serif (Playfair), palette chaude, storytelling
// Chaque section vit dans ./components ; les helpers/thème dans ./theme ; types ./types.
// ─────────────────────────────────────────────────────────────────────────────

// Réexports — l'API publique historique est consommée par lib/db/public.ts,
// lib/db/site.ts, app/site/*, app/dashboard/website/* et lib/explore/sites.ts.
export { accentForSpeciality, styleForTone, defaultServices, defaultTestimonials, defaultResults } from './theme';
export type { CoachSiteData, SiteStyle, CoachServiceItem, CoachTestimonialItem, CoachResultItem } from './types';

// Ordre NARRATIF des sections par style (B.1). La structure varie, pas seulement la
// couleur/typo — chaque ordre a un sens :
//   impact       → aller droit au but : forces/offre d'abord, preuve, puis la personne.
//   clarte       → instaurer la confiance : on présente la personne (à propos) AVANT de vendre.
//   authenticite → storytelling : la voix des clients (témoignages + résultats) en premier.
// Toute section sans données rend `null` (comportement préservé) ; les ancres de nav
// (#apropos/#temoignages/#contact) restent valides quel que soit l'ordre.
const SECTION_ORDER: Record<SiteStyle, ReadonlyArray<'forces' | 'apropos' | 'services' | 'results' | 'temoignages' | 'contact'>> = {
  impact: ['forces', 'services', 'results', 'temoignages', 'apropos', 'contact'],
  clarte: ['apropos', 'forces', 'services', 'results', 'temoignages', 'contact'],
  authenticite: ['temoignages', 'results', 'apropos', 'forces', 'services', 'contact'],
};

export default function CoachSite({ data }: { data: CoachSiteData }) {
  const style: SiteStyle = data.style ?? 'impact';
  const t = themeFor(style);
  const accent = data.accentColor || accentForSpeciality(data.speciality);
  const hasApropos = !!(data.story || data.about || data.bio);
  const hasTemoignages = (data.testimonials?.length ?? 0) > 0;

  const sections: Record<(typeof SECTION_ORDER)[SiteStyle][number], React.ReactNode> = {
    forces: <ForcesSection data={data} style={style} accent={accent} t={t} />,
    apropos: <AProposSection data={data} style={style} accent={accent} t={t} />,
    services: <ServicesSection data={data} accent={accent} t={t} />,
    results: <ResultsSection data={data} accent={accent} t={t} />,
    temoignages: <TemoignagesSection data={data} style={style} accent={accent} t={t} />,
    contact: <ContactSection data={data} style={style} accent={accent} t={t} />,
  };

  return (
    <div style={{ fontFamily: t.fontBody, color: t.ink, background: t.bg, '--site-accent': accent } as React.CSSProperties}>
      <GrainOverlay style={style} />
      <SiteNav name={data.displayName} accent={accent} hasApropos={hasApropos} hasTemoignages={hasTemoignages} />
      <HeroSection data={data} style={style} accent={accent} t={t} />
      {SECTION_ORDER[style].map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
      <SiteFooter data={data} accent={accent} />

      {/* Hover CTA (scale + ombre) — injecté une fois, sans lib. */}
      <style>{`.cs-cta{transition:transform .18s ease, box-shadow .18s ease}.cs-cta:hover{transform:scale(1.02);box-shadow:0 14px 34px -12px ${accent}99}`}</style>
    </div>
  );
}
