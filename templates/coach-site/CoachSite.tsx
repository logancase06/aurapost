import { themeFor, accentForSpeciality } from './theme';
import type { CoachSiteData, SiteStyle } from './types';
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

export default function CoachSite({ data }: { data: CoachSiteData }) {
  const style: SiteStyle = data.style ?? 'impact';
  const t = themeFor(style);
  const accent = data.accentColor || accentForSpeciality(data.speciality);

  return (
    <div style={{ fontFamily: t.fontBody, color: t.ink, background: t.bg, '--site-accent': accent } as React.CSSProperties}>
      <HeroSection data={data} style={style} accent={accent} t={t} />
      <ForcesSection data={data} style={style} accent={accent} t={t} />
      <AProposSection data={data} style={style} accent={accent} t={t} />
      <ServicesSection data={data} accent={accent} t={t} />
      <ResultsSection data={data} accent={accent} t={t} />
      <TemoignagesSection data={data} style={style} accent={accent} t={t} />
      <ContactSection data={data} style={style} accent={accent} t={t} />
      <SiteFooter data={data} accent={accent} />

      {/* Hover CTA (scale + ombre) — injecté une fois, sans lib. */}
      <style>{`.cs-cta{transition:transform .18s ease, box-shadow .18s ease}.cs-cta:hover{transform:scale(1.02);box-shadow:0 14px 34px -12px ${accent}99}`}</style>
    </div>
  );
}
