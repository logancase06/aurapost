import Reveal from '../Reveal';
import type React from 'react';
import { type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function AProposSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const story = data.story || data.about || data.bio || '';
  if (!story) return null;
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;
  const paragraphs = story.split('\n').map((p) => p.trim()).filter(Boolean);
  const headline = (data.storyQuote || '').trim();

  const photoStyle: React.CSSProperties =
    style === 'impact'
      ? { clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)', borderRadius: 0 }
      : style === 'clarte'
        ? { border: '6px solid #fff', borderRadius: 16, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.2)' }
        : { borderRadius: 8, boxShadow: '0 16px 40px -16px rgba(0,0,0,0.15)' };

  return (
    <Reveal as="section" style={wrap}>
      <div id="apropos" className="cs-apropos-grid" style={{ display: 'grid', gridTemplateColumns: data.photoUrl ? 'minmax(0,1.4fr) minmax(0,1fr)' : '1fr', gap: 60, alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent }}>Mon approche</p>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? '14px 0 0' : '16px 0 0', fontSize: 16, lineHeight: 1.85, color: t.muted, whiteSpace: 'pre-line' }}>{p}</p>
          ))}
          {headline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: 20, background: `${accent}15`, color: accent, borderRadius: 9999, padding: '6px 16px', fontSize: 13, fontWeight: 500 }}>
              {headline}
            </span>
          )}
        </div>
        {data.photoUrl && (
          <div className="cs-apropos-media site-image-zoom" style={{ maxWidth: 400, marginLeft: 'auto', width: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block', ...photoStyle }} />
          </div>
        )}
      </div>
      <style>{`@media (max-width:768px){.cs-apropos-grid{grid-template-columns:1fr!important;gap:28px!important}.cs-apropos-media{order:-1;max-width:100%!important}.cs-apropos-media img{height:260px!important;aspect-ratio:auto!important}}`}</style>
    </Reveal>
  );
}
