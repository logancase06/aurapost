import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData } from '../types';

export default function ResultsSection({ data, accent, t }: { data: CoachSiteData; accent: string; t: Theme }) {
  const results = data.results?.length ? data.results : [];
  if (results.length === 0) return null;
  const headFont = headStyle(t);
  const isLight = !t.heroDark;
  const sectionH2 = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 48px' } as const;

  return (
    <section style={{ background: isLight ? t.ink : '#111111', color: '#fff' }}>
      <Reveal style={{ maxWidth: 1080, margin: '0 auto', padding: '100px 24px' }}>
        <h2 style={{ ...sectionH2, color: '#fff' }}>Ce que ça change</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderTop: `3px solid ${accent}`, paddingTop: 24 }}>
              <p style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.5rem)', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{r.result}</p>
              <p style={{ margin: '16px 0 0', fontSize: 14, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                {r.name}{r.city ? ` · ${r.city}` : ''}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
