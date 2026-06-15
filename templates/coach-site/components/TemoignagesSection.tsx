import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function TemoignagesSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  if (!data.testimonials?.length) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;
  const sectionH2 = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 48px' } as const;

  return (
    <Reveal as="section" style={wrap}>
      <div id="temoignages">
        <h2 style={sectionH2}>Ils en parlent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {data.testimonials.map((q, i) => (
            <figure key={i} style={{ margin: 0, background: t.surface, border: `1px solid ${t.border}`, borderRadius: style === 'impact' ? 2 : 14, padding: 28 }}>
              <blockquote style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: t.ink }}>“{q.quote}”</blockquote>
              <figcaption style={{ marginTop: 16, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: accent, textTransform: 'uppercase' }}>{q.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
