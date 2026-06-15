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

export default function ForcesSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const forces = forcesOf(data);
  if (forces.length === 0) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;

  return (
    <Reveal as="section" style={wrap}>
      <div id="forces" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {forces.map((f, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: style === 'impact' ? 2 : 14, padding: 28 }}>
            <span style={{ ...headFont, fontSize: '1.6rem', color: accent }}>{String(i + 1).padStart(2, '0')}</span>
            <p style={{ margin: '10px 0 0', fontSize: 17, fontWeight: 700, color: t.ink }}>{f.title}</p>
            {f.description && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: t.muted }}>{f.description}</p>}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
