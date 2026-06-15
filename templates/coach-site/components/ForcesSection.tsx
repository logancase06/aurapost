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

  // ── CLARTÉ : icône déduite dans un cercle accent, carte blanche ────────────
  if (style === 'clarte') {
    return (
      <Reveal as="section" style={wrap}>
        <div id="forces" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {forces.map((f, i) => {
            const Icon = iconFor(f.title);
            return (
              <Reveal key={i} delay={(i + 1) * 100}>
                <div className="cs-force-clarte" style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, padding: 28 }}>
                  <span style={{ display: 'flex', width: 44, height: 44, borderRadius: '50%', background: `${accent}1A`, color: accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={22} />
                  </span>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: t.ink }}>{f.title}</p>
                  {f.description && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: t.muted }}>{f.description}</p>}
                </div>
              </Reveal>
            );
          })}
        </div>
        <style>{`.cs-force-clarte{transition:transform .2s ease-out,box-shadow .2s ease-out}.cs-force-clarte:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(0,0,0,0.09)}`}</style>
      </Reveal>
    );
  }

  // ── AUTHENTICITÉ : grille asymétrique, fond chaud, bordure gauche accent ───
  return (
    <Reveal as="section" style={wrap}>
      <div id="forces" className="cs-forces-auth" style={{ display: 'grid', gridTemplateColumns: forces.length === 3 ? '2fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {forces.map((f, i) => (
          <Reveal key={i} delay={(i + 1) * 100} style={{ gridRow: forces.length === 3 && i === 0 ? 'span 2' : 'auto', background: '#FDFBF7', borderLeft: `3px solid ${accent}`, borderRadius: 8, padding: '24px 24px 24px 20px' }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.ink }}>{f.title}</p>
            {f.description && <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: t.muted }}>{f.description}</p>}
          </Reveal>
        ))}
      </div>
      <style>{`@media (max-width:768px){.cs-forces-auth{grid-template-columns:1fr!important}.cs-forces-auth>div{grid-row:auto!important}}`}</style>
    </Reveal>
  );
}
