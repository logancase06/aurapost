import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function TemoignagesSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const items = data.testimonials ?? [];
  if (items.length === 0) return null;

  const headFont = headStyle(t);
  const sectionBg = style === 'impact' ? '#09090b' : style === 'clarte' ? '#F9FAFB' : '#F5F5F4';
  const cardBg = style === 'impact' ? '#141414' : '#FFFFFF';
  const sectionH2 = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 48px' } as const;

  const cols = items.length === 1 ? '1fr' : items.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))';
  const maxWidth = items.length === 1 ? 720 : 1080;

  return (
    <section id="temoignages" style={{ background: sectionBg, color: t.ink }}>
      <Reveal style={{ maxWidth: 1080, margin: '0 auto', padding: '100px 24px' }}>
        <h2 style={sectionH2}>Ils en parlent</h2>
        <div style={{ maxWidth, margin: items.length === 1 ? '0 auto' : undefined, display: 'grid', gridTemplateColumns: cols, gap: 24 }}>
          {items.map((q, i) => (
            <figure key={i} style={{ position: 'relative', margin: 0, overflow: 'hidden', background: cardBg, border: `1px solid ${t.border}`, borderRadius: style === 'impact' ? 4 : 16, padding: '32px 28px 28px' }}>
              <span aria-hidden style={{ position: 'absolute', top: -28, left: 8, fontSize: 130, lineHeight: 1, fontFamily: 'Georgia, serif', color: accent, opacity: 0.07, pointerEvents: 'none', userSelect: 'none' }}>&#8220;</span>
              <div aria-hidden style={{ position: 'relative', color: '#FBBF24', fontSize: 14, letterSpacing: 2, marginBottom: 12 }}>★★★★★</div>
              <blockquote style={{ position: 'relative', margin: 0, fontSize: 17, fontStyle: 'italic', lineHeight: 1.8, color: t.ink }}>{q.quote}</blockquote>
              <figcaption style={{ position: 'relative', marginTop: 16, fontSize: 14, fontWeight: 600, color: t.ink }}>— {q.name}</figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
