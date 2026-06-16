import { Sliders, MessageCircle, BookOpen, TrendingUp, Zap, Heart, Star, type LucideIcon } from 'lucide-react';
import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle, Force } from '../types';

/** Forces affichées : data.forces, sinon strengths, sinon les services (3 max). */
export function forcesOf(data: CoachSiteData): Force[] {
  return (
    data.forces?.length
      ? data.forces
      : data.strengths?.length
        ? data.strengths.map((title) => ({ title, description: undefined }))
        : data.services.map((s) => ({ title: s.title, description: s.description }))
  ).slice(0, 3);
}

/** Icône déduite du titre d'une force (style Clarté). */
function iconFor(title: string): LucideIcon {
  const s = title.toLowerCase();
  if (/program|mesure|adapt|niveau/.test(s)) return Sliders;
  if (/dispo|réactif|reactif|répond|repond|message|whatsapp|contact/.test(s)) return MessageCircle;
  if (/pédag|pedag|expli|compren|appren|sais|savoir/.test(s)) return BookOpen;
  if (/résult|resul|transform|progress|objectif/.test(s)) return TrendingUp;
  if (/énerg|energ|motiv|dépass|depass/.test(s)) return Zap;
  if (/santé|sante|nutri|bien|équilibre|equilibre/.test(s)) return Heart;
  return Star;
}

export default function ForcesSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const forces = forcesOf(data).filter((f) => f.title.trim());
  if (forces.length === 0) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '80px 24px' } as const;

  // ── IMPACT : numéro géant en filigrane + hover border-left accent ──────────
  if (style === 'impact') {
    return (
      <Reveal as="section" style={wrap}>
        <div id="forces" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {forces.map((f, i) => (
            <Reveal key={i} delay={(i + 1) * 100}>
              <div className="cs-force-impact" style={{ position: 'relative', overflow: 'hidden', background: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid transparent', borderRadius: 12, padding: 28 }}>
                <span aria-hidden style={{ ...headFont, position: 'absolute', top: -16, right: 16, fontSize: 88, lineHeight: 1, color: accent, opacity: 0.07, pointerEvents: 'none', userSelect: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{ position: 'relative', margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{f.title}</p>
                {f.description && <p style={{ position: 'relative', margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#9ca3af' }}>{f.description}</p>}
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`.cs-force-impact{transition:transform .2s ease-out,box-shadow .2s ease-out,border-color .2s ease-out}.cs-force-impact:hover{transform:translateY(-4px);border-left-color:${accent};box-shadow:0 20px 40px rgba(0,0,0,0.35)}`}</style>
      </Reveal>
    );
  }

  // ── CLARTÉ : LISTE ÉDITORIALE (B.2) — plus de cards. Filet fin entre chaque force,
  //    icône petite alignée à gauche, titre et description sur la même ligne de lecture. ──
  if (style === 'clarte') {
    return (
      <Reveal as="section" style={wrap}>
        <div id="forces">
          {forces.map((f, i) => {
            const Icon = iconFor(f.title);
            return (
              <Reveal key={i} delay={(i + 1) * 100}>
                <div
                  className="cs-force-clarte-row"
                  style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,0.85fr) minmax(0,1.45fr)', gap: 28, alignItems: 'baseline', padding: '30px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.border}` }}
                >
                  <Icon size={22} color={accent} style={{ position: 'relative', top: 4 }} />
                  <h3 style={{ margin: 0, fontSize: 'clamp(1.15rem,2.2vw,1.45rem)', fontWeight: 800, color: t.ink, lineHeight: 1.25 }}>{f.title}</h3>
                  {f.description ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: t.muted }}>{f.description}</p> : <span />}
                </div>
              </Reveal>
            );
          })}
        </div>
        <style>{`@media (max-width:768px){.cs-force-clarte-row{grid-template-columns:24px 1fr!important;gap:14px!important}.cs-force-clarte-row>p{grid-column:2 / -1!important;margin-top:8px!important}}`}</style>
      </Reveal>
    );
  }

  // ── AUTHENTICITÉ : grille asymétrique, fond chaud, bordure gauche accent.
  //    La force PRINCIPALE (la plus grande) intègre une citation client (B.2) → relie
  //    les sections plutôt que des blocs indépendants. ──
  const pull = (data.testimonials?.find((q) => q.quote?.trim())?.quote ?? '').trim();
  return (
    <Reveal as="section" style={wrap}>
      <div id="forces" className="cs-forces-auth" style={{ display: 'grid', gridTemplateColumns: forces.length === 3 ? '2fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {forces.map((f, i) => (
          <Reveal key={i} delay={(i + 1) * 100} style={{ gridRow: forces.length === 3 && i === 0 ? 'span 2' : 'auto', background: '#FDFBF7', borderLeft: `3px solid ${accent}`, borderRadius: 8, padding: '24px 24px 24px 20px' }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.ink }}>{f.title}</p>
            {f.description && <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: t.muted }}>{f.description}</p>}
            {i === 0 && pull && (
              <p style={{ margin: '16px 0 0', paddingTop: 14, borderTop: `1px solid ${accent}33`, fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, color: t.ink }}>
                « {pull.length > 90 ? `${pull.slice(0, 90).trimEnd()}…` : pull} »
              </p>
            )}
          </Reveal>
        ))}
      </div>
      <style>{`@media (max-width:768px){.cs-forces-auth{grid-template-columns:1fr!important}.cs-forces-auth>div{grid-row:auto!important}}`}</style>
    </Reveal>
  );
}
