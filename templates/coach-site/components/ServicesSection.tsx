import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import SectionTitle from './SectionTitle';
import type { CoachSiteData, SiteStyle } from '../types';

export default function ServicesSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  if (data.services.length === 0) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;

  return (
    <Reveal as="section" style={wrap}>
      <SectionTitle style={style} accent={accent} t={t}>Ce qu’on fait ensemble</SectionTitle>
      <div>
        {data.services.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 22, padding: '30px 0', borderTop: `1px solid ${t.border}`, alignItems: 'baseline' }}>
            <span style={{ ...headFont, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: accent }}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 style={{ fontSize: 'clamp(1.15rem, 2.4vw, 1.5rem)', fontWeight: 800, margin: 0, color: t.ink, overflowWrap: 'break-word' }}>{s.title}</h3>
              <p style={{ fontSize: 16, color: t.muted, margin: '10px 0 0', lineHeight: 1.6, maxWidth: 620 }}>{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
